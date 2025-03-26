<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number | string; color?: boolean }>()

const parseValue = computed(() => {
  if (!props.value) return '---'
  if (typeof props.value === 'string') return parseFloat(props.value)
  return props.value
})
</script>

<template>
  <span
    :class="{
      'text-green-400': color && typeof parseValue === 'number' && parseValue > 0,
      'text-red-400': color && typeof parseValue === 'number' && parseValue < 0,
      'text-amber-400':
        (color && typeof parseValue === 'number' && parseValue == 0) ||
        typeof parseValue === 'string',
    }"
  >
    <template v-if="typeof parseValue === 'string'">
      {{ parseValue }}
    </template>
    <template v-else>
      {{ parseValue.toFixed(4) }}
    </template>
  </span>
</template>
