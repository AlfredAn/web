/**
 * This script was used (and might be used in the future) to convert all snake_case names in the schema to PascalCase.
 * The reason is that our schema uses snake_case but prisma guidelines are to use PascalCase.
 * All fields are mapped to snake_case names meaning it should not create a migration in the database, purely a Prisma change.
 *
 * Taken from: https://github.com/prisma/prisma/discussions/2530
 * Taken at: 2023-10-17 16:00
 * Author: Ryan Dsouza https://github.com/ryands17
 */

import * as fs from "fs";
import * as path from "path";
// the following two imports are assumed to be installed globally on your machine if you wish to run this script
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { camelCase, upperFirst } from "lodash";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pluralize from "pluralize";

const PRISMA_FILE_PATH = path.join(__dirname, "schema.prisma");

function snakeToCamel(str: string) {
  return camelCase(str);
}
function snakeToPascal(str: string) {
  return upperFirst(camelCase(str));
}

const PRISMA_PRIMITIVES = ["String", "Boolean", "Int", "Float", "DateTime"];
const KNEX_INTERNAL_MODELS = ["knex_migrations", "knex_migrations_lock", "pgmigrations"];

function isKnexInternalModel(typeName: string) {
  return KNEX_INTERNAL_MODELS.includes(typeName);
}

function isPrimitiveType(typeName: string) {
  return PRISMA_PRIMITIVES.includes(typeName);
}

function fixFieldsArrayString(fields: string) {
  return fields
    .split(", ")
    .map((field) => snakeToCamel(field))
    .join(", ");
}

async function fixPrismaFile() {
  const text = await fs.promises.readFile(PRISMA_FILE_PATH, "utf8");

  const textAsArray = text.split("\n");

  const fixedText: string[] = [];
  let currentModelName: string | null = null;
  let hasAddedModelMap = false;

  for (const line of textAsArray) {
    // Are we at the start of a model definition
    const modelMatch = line.match(/^model (\w+) {$/);
    if (modelMatch) {
      currentModelName = modelMatch[1];
      if (isKnexInternalModel(currentModelName)) {
        continue;
      }
      hasAddedModelMap = false;
      const pascalModelName = snakeToPascal(currentModelName);
      fixedText.push(`model ${pascalModelName} {`);
      continue;
    }

    if (currentModelName && isKnexInternalModel(currentModelName)) {
      continue;
    }

    // We don't need to change anything if we aren't in a model body
    if (!currentModelName) {
      fixedText.push(line);
      continue;
    }

    // Add the @@map to the table name for the model
    if (!hasAddedModelMap && (line.match(/\s+@@/) || line === "}")) {
      if (line === "}") {
        fixedText.push("");
      }
      fixedText.push(`  @@map("${currentModelName}")`);
      hasAddedModelMap = true;
    }

    // Renames field and applies a @map to the field name if it is snake case
    // Adds an s to the field name if the type is an array relation
    const fieldMatch = line.match(/\s\s(\w+)\s+(\w+)(\[\])?/);
    let fixedLine = line;
    if (fieldMatch) {
      const [, currentFieldName, currentFieldType, isArrayType] = fieldMatch;

      let fixedFieldName = snakeToCamel(currentFieldName);
      if (isArrayType && !pluralize.isPlural(fixedFieldName)) {
        fixedFieldName = pluralize.plural(fixedFieldName);
      }

      fixedLine = fixedLine.replace(currentFieldName, fixedFieldName);

      // Add map if we needed to convert the field name and the field is not a relational type
      // If it's relational, the field type will be a non-primitive, hence the isPrimitiveType check
      if (currentFieldName.includes("_") && isPrimitiveType(currentFieldType)) {
        fixedLine = `${fixedLine} @map("${currentFieldName}")`;
      }
    }

    // Capitalizes model names in field types
    const fieldTypeMatch = fixedLine.match(/\s\s\w+\s+(\w+)/);
    if (fieldTypeMatch) {
      const currentFieldType = fieldTypeMatch[1];
      const fieldTypeIndex = fieldTypeMatch[0].lastIndexOf(currentFieldType);
      const fixedFieldType = snakeToPascal(currentFieldType);
      const startOfLine = fixedLine.substr(0, fieldTypeIndex);
      const restOfLine = fixedLine.substr(fieldTypeIndex + currentFieldType.length);
      fixedLine = `${startOfLine}${fixedFieldType}${restOfLine}`;
    }

    // Changes `fields: [relation_id]` in @relation to camel case
    const relationFieldsMatch = fixedLine.match(/fields:\s\[([\w,\s]+)\]/);
    if (relationFieldsMatch) {
      const fields = relationFieldsMatch[1];
      fixedLine = fixedLine.replace(fields, fixFieldsArrayString(fields));
    }

    // Changes fields listed in @@index or @@unique to camel case
    const indexUniqueFieldsMatch = fixedLine.match(/@@\w+\(\[([\w,\s]+)\]/);
    if (indexUniqueFieldsMatch) {
      const fields = indexUniqueFieldsMatch[1];
      fixedLine = fixedLine.replace(fields, fixFieldsArrayString(fields));
    }

    fixedText.push(fixedLine);
  }

  await fs.promises.writeFile(PRISMA_FILE_PATH, fixedText.join("\n"));
}

fixPrismaFile();
