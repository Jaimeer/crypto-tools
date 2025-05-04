<script setup lang="ts">
import { computed, onUnmounted, watch, watchEffect } from 'vue'
import { useMagicKeys } from '@vueuse/core'
import { useBingxKLinesStore } from '../../store/bingx/bingxKLines.store'
import { useBingxChartStore } from '../../store/bingx/bingxChart.store'
import { useBingxPositionsStore } from '../../store/bingx/bingxPositions.store'
import { useBingxTradesStore } from '../../store/bingx/bingxTrades.store'
import { useBingxTransactionsStore } from '../../store/bingx/bingxTransactions.store'
import { useBingxPreferencesStore } from '../../store/bingx/bingxPreferences.store'
import KLineChart from './KLineChart.vue'

const bingxChartStore = useBingxChartStore()
const bingxKLinesStore = useBingxKLinesStore()
const bingxPositionsStore = useBingxPositionsStore()
const bingxTradesStore = useBingxTradesStore()
const bingxTransactionsStore = useBingxTransactionsStore()
const bingxPreferencesStore = useBingxPreferencesStore()

const { escape, arrowup, arrowright, arrowdown, arrowleft } = useMagicKeys()

const positions = computed(() => {
  return bingxPositionsStore.positions
})

const klines15m = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '15m') ?? []
})

const klines4h = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '4h') ?? []
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
      if (oldSymbol && newSymbol !== oldSymbol) {
        bingxKLinesStore.unsubscribeKLines(oldSymbol, '15m')
        bingxKLinesStore.unsubscribeKLines(oldSymbol, '4h')
        bingxKLinesStore.unsubscribeKLines(oldSymbol, '1d')
      }

      bingxKLinesStore.fetchKLines(newSymbol, '15m')
      bingxKLinesStore.fetchKLines(newSymbol, '4h')
      bingxKLinesStore.fetchKLines(newSymbol, '1d')
    } else {
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '15m')
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '4h')
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '1d')
    }
  },
  { immediate: true },
)

const allSymbolsFiltered = computed(() => {
  return bingxTransactionsStore.allSymbols.filter(
    (symbol) =>
      !bingxPreferencesStore.hidedSymbols
        .map((x) => x.toLowerCase())
        .includes(symbol.toLowerCase()),
  )
})

const loadNextSymbol = () => {
  const index = allSymbolsFiltered.value.findIndex(
    (x) => x === bingxChartStore.symbol,
  )
  const newIndex = (index + 1) % allSymbolsFiltered.value.length
  const newSymbol = allSymbolsFiltered.value[newIndex]
  bingxChartStore.setSymbol(newSymbol)
}

const loadPrevSymbol = () => {
  const index = allSymbolsFiltered.value.findIndex(
    (x) => x === bingxChartStore.symbol,
  )
  const newIndex =
    (index - 1 + allSymbolsFiltered.value.length) %
    allSymbolsFiltered.value.length
  const newSymbol = allSymbolsFiltered.value[newIndex]
  bingxChartStore.setSymbol(newSymbol)
}

watchEffect(() => {
  if (bingxChartStore.symbol) {
    if (escape.value) bingxChartStore.resetSymbol()
    if (arrowup.value) loadPrevSymbol
    if (arrowleft.value) loadPrevSymbol()
    if (arrowdown.value) loadNextSymbol()
    if (arrowright.value) loadNextSymbol()
  }
})

onUnmounted(() => {
  if (bingxChartStore.symbol) {
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '15m')
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '4h')
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
              v-if="!klines4h.length"
              class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
            >
              {{ bingxChartStore.symbol }} Fetching data 4h...
            </div>
            <KLineChart
              v-else
              :symbol="bingxChartStore.symbol"
              period="4h"
              :hideTrades="false"
              :klines="klines4h"
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
