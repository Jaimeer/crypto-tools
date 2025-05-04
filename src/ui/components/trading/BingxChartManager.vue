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

const klines15m = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '15m') ?? []
})

const klines1h = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '1h') ?? []
})

const klines1d = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '1d') ?? []
})

const trades = computed(() => {
  return bingxTradesStore.trades
})

watch(
  () => bingxChartStore.symbol,
  (newSymbol, oldSymbol) => {
    if (newSymbol) {
      bingxKLinesStore.fetchKLines(newSymbol, '15m')
      bingxKLinesStore.fetchKLines(newSymbol, '1h')
      bingxKLinesStore.fetchKLines(newSymbol, '1d')
    } else {
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '15m')
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '1h')
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '1d')
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (bingxChartStore.symbol) {
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '15m')
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '1h')
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '1d')
  }
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
      <div class="grid h-full flex-1 grid-cols-3">
        <div class="col-span-2">
          <div
            v-if="!klines15m.length"
            class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
          >
            {{ bingxChartStore.symbol }} Fetching data 15m...
          </div>
          <KLineChart
            v-else
            :symbol="bingxChartStore.symbol"
            period="15m"
            :hideTrades="false"
            :klines="klines15m"
            :trades="trades.filter((x) => x.symbol === bingxChartStore.symbol)"
            :positions="
              positions.filter((x) => x.symbol === bingxChartStore.symbol)
            "
            size="large"
          />
        </div>
        <div>
          <div class="h-1/2">
            <div
              v-if="!klines1h.length"
              class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
            >
              {{ bingxChartStore.symbol }} Fetching data 1h...
            </div>
            <KLineChart
              v-else
              :symbol="bingxChartStore.symbol"
              period="1h"
              :hideTrades="false"
              :klines="klines1h"
              :trades="
                trades.filter((x) => x.symbol === bingxChartStore.symbol)
              "
              :positions="
                positions.filter((x) => x.symbol === bingxChartStore.symbol)
              "
              size="large"
              onlyChart
            />
          </div>
          <div class="h-1/2">
            <div
              v-if="!klines1d.length"
              class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
            >
              {{ bingxChartStore.symbol }} Fetching data 1d...
            </div>
            <KLineChart
              v-else
              :symbol="bingxChartStore.symbol"
              period="1d"
              :hideTrades="false"
              :klines="klines1d"
              :trades="
                trades.filter((x) => x.symbol === bingxChartStore.symbol)
              "
              :positions="
                positions.filter((x) => x.symbol === bingxChartStore.symbol)
              "
              size="large"
              onlyChart
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
