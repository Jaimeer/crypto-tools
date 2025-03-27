<script setup lang="ts">
defineProps<{ num: number }>()
</script>

<template>
  <span
    :class="{
      'text-cyan-400': num >= 20,
      'text-blue-400': num >= 10 && num < 20,
      'text-purple-400': num > 0 && num < 10,
      'text-slate-600': num == 0,
    }"
  >
    [{{ num }}]
  </span>
</template>
