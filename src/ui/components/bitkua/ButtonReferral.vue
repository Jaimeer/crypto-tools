<script setup lang="ts">
const openReferral = () => {
  window.electronAPI.openUrl('https://app.bitkua.com?reference=jaime_odh')
}
</script>

<template>
  <div
    class="w-fit cursor-pointer rounded bg-[#072bf3] px-4 py-1 text-white transition hover:opacity-90"
    @click="openReferral"
  >
    <span>Register in Bitkua</span>
  </div>
</template>
