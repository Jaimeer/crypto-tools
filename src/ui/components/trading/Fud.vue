<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<template>
  <div
    :class="{
      'text-green-600': value < 30,
      'text-yellow-600': value >= 30 && value < 70,
      'text-red-600': value >= 70,
    }"
  >
    {{ value.toFixed(2) }}%
  </div>
</template>
