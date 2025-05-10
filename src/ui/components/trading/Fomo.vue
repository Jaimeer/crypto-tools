<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<template>
  <div
    :class="{
      'text-green-600': value < 100,
      'text-yellow-600': value >= 100 && value < 200,
      'text-red-600': value >= 200,
    }"
  >
    {{ value.toFixed(2) }}%
  </div>
</template>
