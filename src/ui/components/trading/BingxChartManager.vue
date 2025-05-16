<script setup lang="ts">
import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useMagicKeys } from '@vueuse/core'
import { useBingxKLinesStore } from '../../store/bingx/bingxKLines.store'
import { useBingxChartStore } from '../../store/bingx/bingxChart.store'
import { useBingxPositionsStore } from '../../store/bingx/bingxPositions.store'
import { useBingxTradesStore } from '../../store/bingx/bingxTrades.store'
import { useBingxTransactionsStore } from '../../store/bingx/bingxTransactions.store'
import { useBingxPreferencesStore } from '../../store/bingx/bingxPreferences.store'
import { useBitkuaBotsStore } from '../../store/bitkua/bitkuaBots.store'
import { useBingxBalanceStore } from '../../store/bingx/bingxBalance.store'
import { useBingxContractsStore } from '../../store/bingx/bingxContracts.store'
import { useNotificationsStore } from '../../store/general/notifications.store'
import { useBitkuaDataMarketStore } from '../../store/bitkua/bitkuaDataMarket.store'
import KLineChart from './KLineChart.vue'
import BotCreate from '../bitkua/BotCreate.vue'
import PositionSummary from '../tables/PositionSummary.vue'
import { subDays, subMonths, subYears } from 'date-fns'
import Price from '../trading/Price.vue'
import Fomo from './Fomo.vue'
import Fud from './Fud.vue'

const bingxChartStore = useBingxChartStore()
const bingxKLinesStore = useBingxKLinesStore()
const bingxPositionsStore = useBingxPositionsStore()
const bingxTradesStore = useBingxTradesStore()
const bingxTransactionsStore = useBingxTransactionsStore()
const bingxPreferencesStore = useBingxPreferencesStore()
const BitkuaBotsStore = useBitkuaBotsStore()
const bingxBalanceStore = useBingxBalanceStore()
const bingxContractsStore = useBingxContractsStore()
const notificationsStore = useNotificationsStore()
const bitkuaDataMarketStore = useBitkuaDataMarketStore()

const exchange = 'Bingx'

const { escape, arrowup, arrowright, arrowdown, arrowleft } = useMagicKeys()

const autoView = ref(false)

const positions = computed(() => {
  return bingxPositionsStore.positions.filter(
    (x) => x.symbol === bingxChartStore.symbol,
  )
})

const transactions = computed(() => {
  return bingxTransactionsStore.transactions.filter(
    (x) => x.symbol === bingxChartStore.symbol,
  )
})

const klines1h = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '1h') ?? []
})

const klines4h = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '4h') ?? []
})

const klines1d = computed(() => {
  return bingxKLinesStore.kLine(bingxChartStore.symbol, '1d') ?? []
})

const balance = computed(() => {
  return bingxBalanceStore.balance
})

const trades = computed(() => {
  return bingxTradesStore.trades
})

const contracts = computed(() => {
  return bingxContractsStore.contracts
})

const bots = computed(() => {
  return BitkuaBotsStore.bots.filter((x) => x.symbol === bingxChartStore.symbol)
})

const dateMarket = computed(() => {
  return bitkuaDataMarketStore.dataMarket.find(
    (x) => x.symbol === bingxChartStore.symbol,
  )
})

const profits = computed(() => {
  const calculateProfit = (date: Date) =>
    transactions.value.reduce((acc, transaction) => {
      if (transaction.symbol === bingxChartStore.symbol) {
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
  () => bingxChartStore.symbol,
  (newSymbol, oldSymbol) => {
    if (newSymbol) {
      if (oldSymbol && newSymbol !== oldSymbol) {
        bingxKLinesStore.unsubscribeKLines(oldSymbol, '1h')
        bingxKLinesStore.unsubscribeKLines(oldSymbol, '4h')
        bingxKLinesStore.unsubscribeKLines(oldSymbol, '1d')
      }

      bingxKLinesStore.fetchKLines(newSymbol, '1h')
      bingxKLinesStore.fetchKLines(newSymbol, '4h')
      bingxKLinesStore.fetchKLines(newSymbol, '1d')
    } else {
      if (oldSymbol) bingxKLinesStore.unsubscribeKLines(oldSymbol, '1h')
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

const lastTrade = ref(trades.value[0])
watch(
  () => trades.value,
  () => {
    const newLastTrade = trades.value[0]
    const isFirstExecution = !!lastTrade.value

    if (!newLastTrade || lastTrade.value?.tradeId === newLastTrade.tradeId)
      return

    const lastIndex = lastTrade.value
      ? trades.value.findIndex((x) => x.tradeId === lastTrade.value.tradeId)
      : trades.value.length

    if (isFirstExecution)
      for (let i = lastIndex - 1; i >= 0; i--) {
        const trade = trades.value[i]
        const message = trade.realisedPNL ? 'Close' : 'Average'
        const type = trade.realisedPNL ? 'success' : 'info'
        notificationsStore.processMessage({
          api: 'Bingx',
          action: `Trade created`,
          type,
          title: `Trade ${message}`,
          message: ``,
          metadata: {
            symbol: trade.symbol,
            side: trade.side,
            amount: trade.realisedPNL.toFixed(2),
          },
        })
      }

    lastTrade.value = newLastTrade
    if (autoView.value) {
      bingxChartStore.setSymbol(newLastTrade.symbol)
    }
  },
  { deep: true },
)

watchEffect(() => {
  if (bingxChartStore.symbol) {
    if (escape.value) bingxChartStore.resetSymbol()
    if (arrowup.value) loadPrevSymbol()
    if (arrowleft.value) loadPrevSymbol()
    if (arrowdown.value) loadNextSymbol()
    if (arrowright.value) loadNextSymbol()
  }
})

onUnmounted(() => {
  if (bingxChartStore.symbol) {
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '1h')
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '4h')
    bingxKLinesStore.unsubscribeKLines(bingxChartStore.symbol, '1d')
  }
})
</script>

<template>
  <div
    v-if="bingxChartStore.symbol"
    class="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-end bg-slate-900/50 backdrop-blur-xs transition"
    @click="bingxChartStore.resetSymbol()"
  >
    <!-- <div class="flex-1 bg-slate-700 backdrop-blur-xs"></div> -->
    <div
      class="flex h-[94%] w-full flex-col items-center justify-center border-t-2 border-t-slate-800 bg-slate-900"
      @click="$event.stopPropagation()"
    >
      <div
        class="flex w-full items-center justify-between rounded-t border border-b-0 border-slate-600 bg-slate-900 p-2"
      >
        <BotCreate
          :symbol="bingxChartStore.symbol"
          :exchange="exchange"
          :key="bingxChartStore.symbol"
        />
        <div class="flex items-center gap-2 text-sm">
          <div v-for="[key, value] in Object.entries(profits)" :key="key">
            <div class="text-slate-400">{{ key }}</div>
            <Price :value="value" :decimals="2" />
          </div>
          <div>
            <div class="text-slate-400">fomo</div>
            <Fomo :value="dateMarket.fomo" />
          </div>
          <div>
            <div class="text-slate-400">fud</div>
            <Fud :value="dateMarket.fud" />
          </div>
          <div>
            <div class="text-slate-400">liqMax</div>
            <Price :value="dateMarket.liqMax" color="green" />
          </div>
          <div>
            <div class="text-slate-400">liqMin</div>
            <Price :value="dateMarket.liqMin" color="red" />
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
            @click="bingxChartStore.resetSymbol()"
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
            {{ bingxChartStore.symbol }} Fetching data 1h...
          </div>
          <KLineChart
            v-else
            :symbol="bingxChartStore.symbol"
            period="1h"
            :hideTrades="false"
            :klines="klines1h"
            :trades="trades.filter((x) => x.symbol === bingxChartStore.symbol)"
            :positions="
              positions.filter((x) => x.symbol === bingxChartStore.symbol)
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
              printDKIndicator
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
