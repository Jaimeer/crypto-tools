<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBingXTransactionsStore } from '../store/bingxTransactions.store'
import KLineChart from '../components/KLineChart.vue'
import { Periods } from 'src/server/Bingx.service'
import { useBingXTradesStore } from '../store/bingxTrades.store'
import { useIntervalFn } from '@vueuse/core'
import { useBingXPositionsStore } from '../store/bingxPositions.store'
import { usePreferencesStore } from '../store/preferences.store'
import { useBingXKLinesStore } from '../store/bingxKLines.store'

const bingXTransactionsStore = useBingXTransactionsStore()
const bingXTradesStore = useBingXTradesStore()
const bingXPositionsStore = useBingXPositionsStore()
const preferencesStore = usePreferencesStore()
const bingXKLinesStore = useBingXKLinesStore()

const isRefreshing = ref(false)

const fetchData = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await bingXTradesStore.fetchTrades()
    await bingXPositionsStore.fetchPositions()

    await Promise.all(
      bingXTransactionsStore.allSymbols.map(symbol =>
        bingXKLinesStore.fetchKLines(symbol, selectedPeriod.value)
      )
    )
    // for (const symbol of bingXTransactionsStore.allSymbols /*.filter(x => x === 'FARTCOIN-USDT')*/) {
    //   await bingXKLinesStore.fetchKLines(symbol, selectedPeriod.value)
    // }
  } finally {
    isRefreshing.value = false
  }
}

const periodsOptions: Periods[] = [
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '6h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
  '1M',
]

const selectedPeriod = ref<Periods>('15m')
const hideTrades = ref(preferencesStore.hideTrades)

const { resume } = useIntervalFn(fetchData, 1000, { immediate: false })

onMounted(async () => {
  await fetchData()
  resume()
})
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-2">
        <h1 class="text-xl font-bold">BingX Transactions</h1>
        <RouterLink
          to="/"
          class="px-4 py-1 bg-slate-500 text-white rounded hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
        >
          Dashboard
        </RouterLink>
      </div>
      <div>
        <div class="flex gap-3 items-center">
          Hide trade
          <input type="checkbox" v-model="hideTrades" />
          Period
          <button
            v-for="option in periodsOptions"
            @click="selectedPeriod = option"
            :key="option"
            :class="{
              'text-slate-200': selectedPeriod === option,
              'text-slate-600': selectedPeriod !== option,
            }"
          >
            {{ option }}
          </button>
          <button
            @click="fetchData"
            class="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
            :disabled="isRefreshing || bingXTransactionsStore.loading"
          >
            <span v-if="isRefreshing || bingXTransactionsStore.loading">Refreshing...</span>
            <span v-else>Refresh</span>
          </button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="symbol in bingXTransactionsStore.allSymbols /*.filter(x => x === 'FARTCOIN-USDT')*/"
        class="border rounded border-gray-600 p-4 w-full h-96 relative"
        :key="`${selectedPeriod}-${symbol}`"
      >
        <div
          v-if="!bingXKLinesStore.kLine(symbol, selectedPeriod)?.length"
          class="text-slate-600 flex items-center justify-center h-full"
        >
          {{ symbol }} Fetching data...
        </div>
        <KLineChart
          v-else
          :symbol="symbol"
          :periods="selectedPeriod"
          :hideTrades="hideTrades"
          :klines="bingXKLinesStore.kLine(symbol, selectedPeriod) ?? []"
          :trades="bingXTradesStore.trades.filter(x => x.symbol === symbol)"
          :positions="bingXPositionsStore.positions.filter(x => x.symbol === symbol)"
        />
      </div>
    </div>
  </div>
</template>
