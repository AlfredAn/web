<script lang="ts">
  import { enhance } from "$app/forms";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { getImageUrl } from "$lib/files/images";
  import apiNames from "$lib/utils/apiNames";
  import PositionCard from "./PositionCard.svelte";

  export let data;
  export let form;
  $: everyOtherPosition = data.positions.filter((_, i) => i % 2 === 0);
  $: everyOtherPosition2 = data.positions.filter((_, i) => i % 2 === 1);
  let isEditing = false;
</script>

<header class="mb-2 flex items-center gap-4">
  <figure class="w-14">
    <img
      src={getImageUrl(data.committee.imageUrl ?? "minio/material/committees/sigill.svg")}
      alt="Committee icon"
      class="aspect-square"
    />
  </figure>
  <div class="flex-1">
    <div class="flex items-center justify-between">
      <PageHeader title={data.committee.name} />
      {#if data.accessPolicies.includes(apiNames.COMMITTEE.UPDATE) || data.accessPolicies.includes(apiNames.POSITION.CREATE)}
        <button
          class="btn btn-secondary btn-sm"
          on:click={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? "Sluta redigera" : "Redigera"}
        </button>
      {/if}
    </div>
    <h2 class="-mt-4">
      {data.uniqueMemberCount} funktionärer, {data.numberOfMandates} olika mandat
    </h2>
  </div>
</header>
{#if data.committee.description}
  <p class="mb-4">{data.committee.description}</p>
{/if}

<!-- Edit committee form -->
{#if isEditing && data.accessPolicies.includes(apiNames.COMMITTEE.UPDATE)}
  <form
    action="?/update"
    method="POST"
    use:enhance={() =>
      async ({ update, result }) => {
        await update({ reset: false });
        if (result.type === "failure") {
          console.log(result);
          return;
        }
        console.log(result);
        isEditing = false;
      }}
    class="form-control"
    enctype="multipart/form-data"
  >
    <Input label="Namn" name="name" value={form?.data?.name ?? data.committee.name} />
    <!-- <Labeled label="Namn" id="name">
      <input
        name="name"
        id="name"
        value={form?.data?.name ?? data.committee.name}
        class="input input-bordered"
        type="text"
      />
    </Labeled> -->
    <Labeled label="Beskrivning" id="description">
      <textarea
        name="description"
        id="description"
        class="textarea textarea-bordered"
        rows="3"
        value={form?.data?.description ?? data.committee.description}
      />
    </Labeled>
    <Labeled
      label="Utskottsbild"
      id="image"
      explanation="Detta ska vara svg format, utan bakgrundsfärg, utan onödigt whitespace och med vit text."
    >
      <input
        name="image"
        id="image"
        class=" file-input file-input-bordered w-full max-w-xs"
        type="file"
        accept=".svg"
      />
    </Labeled>
    <button type="submit" class="btn btn-secondary my-4">Spara</button>
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </form>
{/if}

<div class="hidden grid-cols-2 gap-4 md:grid">
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherPosition as position (position.id)}
      <PositionCard {position} mandates={position.mandates} />
    {/each}
  </div>
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherPosition2 as position (position.id)}
      <PositionCard {position} mandates={position.mandates} />
    {/each}
  </div>
</div>
<div class="grid gap-4 md:hidden">
  {#each data.positions as position (position.id)}
    <PositionCard {position} mandates={position.mandates} />
  {/each}
</div>
