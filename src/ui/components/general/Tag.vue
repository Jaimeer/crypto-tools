<script setup lang="ts">
const props = defineProps<{
  value: string
  color: 'red' | 'blue' | 'green' | 'pink' | 'violet'
}>()
</script>

<template>
  <div
    class="w-fit rounded px-1 py-0.5 font-bold whitespace-nowrap"
    :class="{
      'bg-red-500 text-red-950': color === 'red',
      'bg-blue-500 text-blue-950': color === 'blue',
      'bg-green-800 text-green-50': color === 'green',
      'bg-pink-800 text-pink-50': color === 'pink',
      'bg-violet-800 text-violet-50': color === 'violet',
    }"
  >
    {{ value }}
  </div>
</template>
