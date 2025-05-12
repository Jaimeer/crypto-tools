<script setup lang="ts">
import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useMagicKeys } from '@vueuse/core'
import { useBitgetKLinesStore } from '../../store/bitget/bitgetKLines.store'
import { useBitgetChartStore } from '../../store/bitget/bitgetChart.store'
import { useBitgetPositionsStore } from '../../store/bitget/bitgetPositions.store'
import { useBitgetTradesStore } from '../../store/bitget/bitgetTrades.store'
import { useBitgetTransactionsStore } from '../../store/bitget/bitgetTransactions.store'
import { useBitgetPreferencesStore } from '../../store/bitget/bitgetPreferences.store'
import { useBitkuaBotsStore } from '../../store/bitkua/bitkuaBots.store'
import { useBitgetBalanceStore } from '../../store/bitget/bitgetBalance.store'
import { useBitgetContractsStore } from '../../store/bitget/bitgetContracts.store'
import KLineChart from './KLineChart.vue'
import BotCreate from '../bitkua/BotCreate.vue'
import PositionSummary from '../tables/PositionSummary.vue'
import { subDays, subMonths, subYears } from 'date-fns'
import Price from '../trading/Price.vue'

const bitgetChartStore = useBitgetChartStore()
const bitgetKLinesStore = useBitgetKLinesStore()
const bitgetPositionsStore = useBitgetPositionsStore()
const bitgetTradesStore = useBitgetTradesStore()
const bitgetTransactionsStore = useBitgetTransactionsStore()
const bitgetPreferencesStore = useBitgetPreferencesStore()
const BitkuaBotsStore = useBitkuaBotsStore()
const bitgetBalanceStore = useBitgetBalanceStore()
const bitgetContractsStore = useBitgetContractsStore()

const exchange = 'Bitget'

const { escape, arrowup, arrowright, arrowdown, arrowleft } = useMagicKeys()

const autoView = ref(false)

const positions = computed(() => {
  return bitgetPositionsStore.positions.filter(
    (x) => x.symbol === bitgetChartStore.symbol,
  )
})

const transactions = computed(() => {
  return bitgetTransactionsStore.transactions.filter(
    (x) => x.symbol === bitgetChartStore.symbol,
  )
})

const klines1h = computed(() => {
  return bitgetKLinesStore.kLine(bitgetChartStore.symbol, '1h') ?? []
})

const klines4h = computed(() => {
  return bitgetKLinesStore.kLine(bitgetChartStore.symbol, '4h') ?? []
})

const klines1d = computed(() => {
  return bitgetKLinesStore.kLine(bitgetChartStore.symbol, '1d') ?? []
})

const balance = computed(() => {
  return bitgetBalanceStore.balance
})

const trades = computed(() => {
  return bitgetTradesStore.trades
})

const contracts = computed(() => {
  return bitgetContractsStore.contracts
})

const bots = computed(() => {
  return BitkuaBotsStore.bots.filter(
    (x) => x.symbol === bitgetChartStore.symbol,
  )
})

const profits = computed(() => {
  const calculateProfit = (date: Date) =>
    transactions.value.reduce((acc, transaction) => {
      if (transaction.symbol === bitgetChartStore.symbol) {
        if (transaction.time > date.getTime()) {
          return acc + transaction.income
        }
      }
      return acc
    }, 0)
  return {
    day: calculateProfit(subDays(new Date(), 1)),
    week: calculateProfit(subDays(new Date(), 7)),
    month: calculateProfit(subMonths(new Date(), 1)),
    total: calculateProfit(subYears(new Date(), 100)),
  }
})

watch(
  () => bitgetChartStore.symbol,
  (newSymbol, oldSymbol) => {
    if (newSymbol) {
      if (oldSymbol && newSymbol !== oldSymbol) {
        bitgetKLinesStore.unsubscribeKLines(oldSymbol, '1h')
        bitgetKLinesStore.unsubscribeKLines(oldSymbol, '4h')
        bitgetKLinesStore.unsubscribeKLines(oldSymbol, '1d')
      }

      bitgetKLinesStore.fetchKLines(newSymbol, '1h')
      bitgetKLinesStore.fetchKLines(newSymbol, '4h')
      bitgetKLinesStore.fetchKLines(newSymbol, '1d')
    } else {
      if (oldSymbol) bitgetKLinesStore.unsubscribeKLines(oldSymbol, '1h')
      if (oldSymbol) bitgetKLinesStore.unsubscribeKLines(oldSymbol, '4h')
      if (oldSymbol) bitgetKLinesStore.unsubscribeKLines(oldSymbol, '1d')
    }
  },
  { immediate: true },
)

const allSymbolsFiltered = computed(() => {
  return bitgetTransactionsStore.allSymbols.filter(
    (symbol) =>
      !bitgetPreferencesStore.hidedSymbols
        .map((x) => x.toLowerCase())
        .includes(symbol.toLowerCase()),
  )
})

const loadNextSymbol = () => {
  const index = allSymbolsFiltered.value.findIndex(
    (x) => x === bitgetChartStore.symbol,
  )
  const newIndex = (index + 1) % allSymbolsFiltered.value.length
  const newSymbol = allSymbolsFiltered.value[newIndex]
  bitgetChartStore.setSymbol(newSymbol)
}

const loadPrevSymbol = () => {
  const index = allSymbolsFiltered.value.findIndex(
    (x) => x === bitgetChartStore.symbol,
  )
  const newIndex =
    (index - 1 + allSymbolsFiltered.value.length) %
    allSymbolsFiltered.value.length
  const newSymbol = allSymbolsFiltered.value[newIndex]
  bitgetChartStore.setSymbol(newSymbol)
}

const lastTrade = ref(trades.value[0])
watch(
  () => trades.value,
  () => {
    if (autoView.value) {
      const newLastTrade = trades.value[0]

      if (lastTrade.value?.tradeId !== newLastTrade.tradeId) {
        lastTrade.value = newLastTrade
        bitgetChartStore.setSymbol(newLastTrade.symbol)
      }
    }
  },
  { deep: true },
)

watchEffect(() => {
  if (bitgetChartStore.symbol) {
    if (escape.value) bitgetChartStore.resetSymbol()
    if (arrowup.value) loadPrevSymbol()
    if (arrowleft.value) loadPrevSymbol()
    if (arrowdown.value) loadNextSymbol()
    if (arrowright.value) loadNextSymbol()
  }
})

onUnmounted(() => {
  if (bitgetChartStore.symbol) {
    bitgetKLinesStore.unsubscribeKLines(bitgetChartStore.symbol, '1h')
    bitgetKLinesStore.unsubscribeKLines(bitgetChartStore.symbol, '4h')
    bitgetKLinesStore.unsubscribeKLines(bitgetChartStore.symbol, '1d')
  }
})
</script>

<template>
  <div
    v-if="bitgetChartStore.symbol"
    class="absolute bottom-0 left-0 flex h-screen w-full flex-col justify-end bg-slate-900/50 transition"
    @click="bitgetChartStore.resetSymbol()"
  >
    <div
      class="flex h-[94%] w-full flex-col items-center justify-center border-t-2 border-t-slate-800 bg-slate-900"
      @click="$event.stopPropagation()"
    >
      <div
        class="flex w-full items-center justify-between rounded-t border border-b-0 border-slate-600 bg-slate-900 p-2"
      >
        <BotCreate
          :symbol="bitgetChartStore.symbol"
          :exchange="exchange"
          :key="bitgetChartStore.symbol"
        />
        <div class="flex items-center gap-2">
          <div
            v-for="[key, value] in Object.entries(profits)"
            :key="key"
            class="text-sm"
          >
            <div class="text-slate-400">{{ key }}</div>
            <Price :value="value" :decimals="2" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="autoView = !autoView"
            class="cursor-pointer rounded px-4 py-1 transition hover:opacity-80"
            :class="{
              'bg-violet-500 text-white': autoView,
              'bg-slate-800 text-slate-600': !autoView,
            }"
          >
            <span>Auto view</span>
          </button>
          <div
            class="cursor-pointer px-2 text-slate-600 hover:text-slate-400"
            @click="bitgetChartStore.resetSymbol()"
          >
            X
          </div>
        </div>
      </div>
      <div class="grid h-full w-full flex-1 grid-cols-3 pb-1">
        <div class="col-span-2">
          <div
            v-if="!klines1h.length"
            class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
          >
            {{ bitgetChartStore.symbol }} Fetching data 1h...
          </div>
          <KLineChart
            v-else
            :symbol="bitgetChartStore.symbol"
            period="1h"
            :hideTrades="false"
            :klines="klines1h"
            :trades="trades.filter((x) => x.symbol === bitgetChartStore.symbol)"
            :positions="
              positions.filter((x) => x.symbol === bitgetChartStore.symbol)
            "
            size="large"
            printDKIndicator
          />
        </div>
        <div class="col-span-1">
          <div class="h-1/2">
            <div
              v-if="!klines4h.length"
              class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
            >
              {{ bitgetChartStore.symbol }} Fetching data 4h...
            </div>
            <KLineChart
              v-else
              :symbol="bitgetChartStore.symbol"
              period="4h"
              :hideTrades="false"
              :klines="klines4h"
              :trades="
                trades.filter((x) => x.symbol === bitgetChartStore.symbol)
              "
              :positions="
                positions.filter((x) => x.symbol === bitgetChartStore.symbol)
              "
              size="large"
              onlyChart
              printDKIndicator
            />
          </div>
          <div class="h-1/2">
            <div
              v-if="!klines1d.length"
              class="flex h-full w-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
            >
              {{ bitgetChartStore.symbol }} Fetching data 1d...
            </div>
            <KLineChart
              v-else
              :symbol="bitgetChartStore.symbol"
              period="1d"
              :hideTrades="false"
              :klines="klines1d"
              :trades="
                trades.filter((x) => x.symbol === bitgetChartStore.symbol)
              "
              :positions="
                positions.filter((x) => x.symbol === bitgetChartStore.symbol)
              "
              size="large"
              onlyChart
              printDKIndicator
            />
          </div>
        </div>
      </div>
      <div
        class="w-full rounded-t border border-t-0 border-slate-600 bg-slate-900 p-2"
      >
        <PositionSummary
          :positions="positions"
          :bots="bots"
          :search="''"
          :exchange="exchange"
          :balance="balance"
          :contracts="contracts"
        />
      </div>
    </div>
  </div>
</template>
