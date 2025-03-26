<script setup lang="ts">
defineProps<{ num: number; color?: boolean }>()
</script>

<template>
  <span
    :class="{
      'text-cyan-400': color && num >= 20,
      'text-blue-400': color && num >= 10 && num < 20,
      'text-purple-400': color && num > 0 && num < 10,
      'text-slate-600': color && num == 0,
    }"
  >
    [{{ num }}]
  </span>
</template>
