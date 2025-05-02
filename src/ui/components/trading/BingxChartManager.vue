<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { useBingxKLinesStore } from '../../store/bingx/bingxKLines.store'
import { useBingxChartStore } from '../../store/bingx/bingxChart.store'
import { useBingxPositionsStore } from '../../store/bingx/bingxPositions.store'
import { useBingxTradesStore } from '../../store/bingx/bingxTrades.store'
import KLineChart from './KLineChart.vue'

const bingxChartStore = useBingxChartStore()
const bingxKLinesStore = useBingxKLinesStore()
const bingxPositionsStore = useBingxPositionsStore()
const bingxTradesStore = useBingxTradesStore()

const positions = computed(() => {
  return bingxPositionsStore.positions
})

const klines = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '15m') ?? []
})

const trades = computed(() => {
  return bingxTradesStore.trades
})

watch(
  () => bingxChartStore.symbol,
  (newSymbol, oldSymbol) => {
    if (newSymbol) {
      bingxKLinesStore.fetchKLines(newSymbol, '15m')
    } else {
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '15m')
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (bingxChartStore.symbol)
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '15m')
})
</script>

<template>
  <div
    v-if="bingxChartStore.symbol"
    class="absolute bottom-0 flex h-screen w-full flex-col justify-end bg-slate-900/50 transition"
    @click="bingxChartStore.resetSymbol()"
  >
    <div
      class="flex h-[80%] w-full items-center justify-center border-t-2 border-t-slate-800 bg-slate-900"
      @click="$event.stopPropagation()"
    >
      <div
        v-if="!klines.length"
        class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
      >
        {{ bingxChartStore.symbol }} Fetching data...
      </div>
      <KLineChart
        v-else
        :symbol="bingxChartStore.symbol"
        period="15m"
        :hideTrades="false"
        :klines="klines"
        :trades="trades.filter((x) => x.symbol === bingxChartStore.symbol)"
        :positions="
          positions.filter((x) => x.symbol === bingxChartStore.symbol)
        "
        size="large"
      />
    </div>
  </div>
</template>
