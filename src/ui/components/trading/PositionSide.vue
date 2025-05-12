<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = defineProps<{
  positionSide: 'SHORT' | 'LONG'
}>()
</script>

<template>
  <div
    class="flex w-fit items-center gap-0.5 rounded text-[10px] font-bold"
    :class="{
      'text-red-400': positionSide === 'SHORT',
      'text-green-400': positionSide === 'LONG',
    }"
  >
    <Icon
      class=""
      :icon="positionSide === 'SHORT' ? 'mdi:arrow-down' : 'mdi:arrow-up'"
    />
    {{ positionSide }}
  </div>
</template>
