<script setup lang="ts">
import { computed } from 'vue'
import Price from './Price.vue'

import { useElementHover } from '@vueuse/core'
import { useTemplateRef } from 'vue'
import { Position } from '../../server/data.dto'

const props = defineProps<{
  symbol: string
  side: 'long' | 'short'
  allVisible: boolean
  gaps: number[]
  positions: Position[]
}>()

const myHoverableElement = useTemplateRef<HTMLButtonElement>('rescueElement')
const isHovered = useElementHover(myHoverableElement)

const position = computed(() => {
  return props.positions.find(
    (position) =>
      position.symbol === props.symbol &&
      position.positionSide === props.side.toUpperCase(),
  )
})

const investToToGap = (desiredGap: number) => {
  if (!position.value) return 0
  const markPrice = position.value.markPrice
  const avgOpenPrice = position.value.avgPrice
  const positionValue = position.value.positionValue
  const leverage = position.value.leverage

  const offset = (avgOpenPrice - markPrice) * (desiredGap / 100)
  const newAvgOpenPrice = markPrice + offset

  const currentTokens = positionValue / markPrice
  const q =
    (currentTokens * (avgOpenPrice - newAvgOpenPrice)) /
    (newAvgOpenPrice / markPrice - 1)
  return q / leverage
}
</script>

<template>
  <div class="flex gap-1 text-xs" ref="rescueElement">
    <template v-for="gap in gaps" :key="gap">
      <div v-if="investToToGap(gap) > 0">
        {{ gap }}%[
        <Price :value="investToToGap(gap)" :decimals="2" color="orange" />]
      </div>
      <div v-else class="text-slate-600">---</div>
    </template>
  </div>
</template>
