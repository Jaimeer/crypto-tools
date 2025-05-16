<script setup lang="ts">
import { computed } from 'vue'
import Symbol from '../trading/Symbol.vue'

const props = defineProps<{
  keyValue: string
  value: string
  color: 'red' | 'blue' | 'green'
}>()

const _color = computed(() => {
  return { won: 'green' }[props.keyValue] ?? props.color
})
</script>

<template>
  <div
    v-if="value"
    class="flex w-fit items-center gap-0 font-bold whitespace-nowrap"
  >
    <div
      class="rounded-l border border-r-0 px-1 py-0.5 capitalize"
      :class="{
        'border-red-800 bg-red-600 text-white': _color === 'red',
        'border-blue-800 bg-blue-600 text-white': _color === 'blue',
        'border-green-800 bg-green-600 text-white': _color === 'green',
      }"
    >
      {{ keyValue }}
    </div>
    <div
      class="rounded-r border border-l-0 px-1 py-0.5"
      :class="{
        'border-red-800 bg-slate-600 text-white': _color === 'red',
        'border-blue-800 bg-slate-600 text-white': _color === 'blue',
        'border-green-800 bg-slate-600 text-white': _color === 'green',
      }"
    >
      <template v-if="keyValue === 'symbol'">
        {{ value }}
      </template>
      <template v-else>
        {{ value }}
      </template>
    </div>
  </div>
</template>
