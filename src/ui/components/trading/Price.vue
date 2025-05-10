<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number | string | undefined
  color?: 'violet' | 'green' | 'red' | 'amber' | 'orange' | 'gray'
  decimals?: number
  suffix?: string
  prefix?: string
}>()

const parseValue = computed(() => {
  if (!props.value) return '---'
  if (typeof props.value === 'string') return parseFloat(props.value)
  return props.value
})
</script>

<template>
  <span
    :class="{
      'text-violet-400': color === 'violet',
      'text-orange-400': color === 'orange',
      'text-green-400':
        color === 'green' || (typeof parseValue === 'number' && parseValue > 0),
      'text-red-400':
        color === 'red' || (typeof parseValue === 'number' && parseValue < 0),
      'text-amber-400':
        color === 'amber' ||
        (typeof parseValue === 'number' && parseValue == 0) ||
        typeof parseValue === 'string',
      'text-slate-400':
        color === 'gray' ||
        (typeof parseValue === 'number' && parseValue == 0) ||
        typeof parseValue === 'string',
    }"
  >
    <template v-if="parseValue !== '---'">{{ prefix }}</template>
    <template v-if="typeof parseValue === 'string'">
      {{ parseValue }}
    </template>
    <template v-else>
      {{
        new Intl.NumberFormat('de-DE', {
          minimumFractionDigits: decimals ?? 4,
          maximumFractionDigits: decimals ?? 4,
        }).format(parseValue)
      }}
    </template>
    <template v-if="parseValue !== '---'">{{ suffix }}</template>
  </span>
</template>
