<script lang="ts">
  export let data;
</script>

<div class="min-h-screen bg-[url('/hero-image.jpg')] bg-cover bg-center bg-no-repeat">
  <div class="bg-opacity-60"></div>
  <h1>{data.numberOfUniqueVolunteers} unika funkisar</h1>
  <h1>{data.numberOfMandates} mandat</h1>
  <div class="text-neutral-content">
    <div class="p-2 pt-32 md:p-48">
      <p class="mb-2 text-3xl font-bold md:mb-4 md:text-8xl">
        Det <span class="text-primary"> roliga </span> <br class="hidden md:block" />
        med plugget
      </p>
      <h1 class="mb-2 text-2xl font-bold text-primary md:mb-8 md:text-4xl">
        D-sektionen inom TLTH
      </h1>
      <button class="btn btn-primary btn-outline">För företag</button>
    </div>
  </div>
</div>
