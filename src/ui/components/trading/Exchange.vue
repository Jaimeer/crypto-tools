<script setup lang="ts">
const props = defineProps<{
  value: string
}>()
</script>

<template>
  <div
    class="w-fit rounded px-2 py-0.5 font-bold"
    :class="{
      'bg-[#00e0ff] text-slate-50': value.toLowerCase() === 'bitget',
      'bg-[#2a66ff] text-slate-50': value.toLowerCase() === 'bingx',
      'bg-[#20b093] text-slate-50': value.toLowerCase() === 'kucoin',      
    }"
  >
    {{ value }}
  </div>
</template>
