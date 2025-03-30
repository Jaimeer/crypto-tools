<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { differenceInDays, differenceInHours, format, startOfDay, subHours } from 'date-fns'
import { useBingXTransactionsStore } from '../store/bingxTransactions.store'
import { useBingXBalanceStore } from '../store/bingxBalance.store'
import { useBingXPositionsStore } from '../store/bingxPositions.store'
import Price from './Price.vue'
import Table from './Table.vue'
import NumTrades from './NumTrades.vue'
import { useIntervalFn } from '@vueuse/core'
import { useBingXConfigStore } from '../store/bingxConfig.store'
import { usePreferencesStore } from '../store/preferences.store'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { useBingXTradesStore } from '../store/bingxTrades.store'
import { RouterLink } from 'vue-router'

const bingXConfig = useBingXConfigStore()
const bingXTradesStore = useBingXTradesStore()
const bingXTransactionsStore = useBingXTransactionsStore()
const bingXBalanceStore = useBingXBalanceStore()
const bingXPositionsStore = useBingXPositionsStore()
const preferencesStore = usePreferencesStore()
const isRefreshing = ref(false)
const autoRefreshEnabled = ref(true)

type PriceData = { num: number; pnl: number; all: number; charges: number; volume: number }

const refreshTransactions = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await bingXTransactionsStore.fetchTransactions()
    await bingXTradesStore.fetchTrades()
    await bingXBalanceStore.fetchBalance()
    await bingXPositionsStore.fetchPositions()
  } finally {
    isRefreshing.value = false
  }
}

const { pause, resume } = useIntervalFn(refreshTransactions, 60000, { immediate: false })

const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value
  if (autoRefreshEnabled.value) {
    resume()
  } else {
    pause()
  }
}

const transactions = computed(() => {
  return bingXTransactionsStore.transactions.filter(x => x.symbol)
})

const trades = computed(() => {
  return bingXTradesStore.trades
})

const incomeTransactions = computed(() => {
  return bingXTransactionsStore.transactions.filter(x => !x.symbol)
})

const totalIncomeTransactions = computed(() => {
  return incomeTransactions.value
    .map(x => x.income)
    .reduce((acc, value) => {
      return acc + parseFloat(value)
    }, 0)
})

const transactionsBySymbol = computed(() => {
  const data = transactions.value.reduce((acc, transaction) => {
    if (!usedSymbols.value.includes(transaction.symbol)) {
      return acc
    }
    if (!acc[transaction.symbol]) {
      acc[transaction.symbol] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
    }
    if (transaction.incomeType === 'REALIZED_PNL') {
      acc[transaction.symbol].num++
      acc[transaction.symbol].pnl += parseFloat(transaction.income)
    } else {
      acc[transaction.symbol].charges += parseFloat(transaction.income)
    }
    acc[transaction.symbol].all += parseFloat(transaction.income)
    return acc
  }, {} as Record<string, PriceData>)

  trades.value.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
    }
    if (parseFloat(trade.realisedPNL) !== 0) return acc
    acc[trade.symbol].volume += parseFloat(trade.quoteQty)
    return acc
  }, data)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.all - a.all)
})

const transactionsByDay = computed(() => {
  const data = transactions.value.reduce((acc, transaction) => {
    const date = format(new Date(transaction.time), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
    }
    if (transaction.incomeType === 'REALIZED_PNL') {
      acc[date].num++
      acc[date].pnl += parseFloat(transaction.income)
    } else {
      acc[date].charges += parseFloat(transaction.income)
    }
    acc[date].all += parseFloat(transaction.income)
    return acc
  }, {} as Record<string, PriceData>)

  trades.value.reduce((acc, trade) => {
    const date = format(new Date(trade.filledTime), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
    }
    if (parseFloat(trade.realisedPNL) !== 0) return acc
    acc[date].volume += parseFloat(trade.quoteQty)
    return acc
  }, data)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.key.localeCompare(a.key))
})

const transactionsBySymbolAndDay = computed(() => {
  const data = transactions.value.reduce((acc, transaction) => {
    const date = format(new Date(transaction.time), 'yyyy-MM-dd')
    const symbol = transaction.symbol
    if (!acc[date]) acc[date] = {}
    if (!acc[date][symbol]) acc[date][symbol] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
    if (transaction.incomeType === 'REALIZED_PNL') {
      acc[date][symbol].num++
      acc[date][symbol].pnl += parseFloat(transaction.income)
    } else {
      acc[date][symbol].charges += parseFloat(transaction.income)
    }
    acc[date][symbol].all += parseFloat(transaction.income)
    return acc
  }, {} as Record<string, Record<string, PriceData>>)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({
      key,
      total: Object.values(value).reduce((acc, value) => {
        return acc + value.all
      }, 0),
      num: Object.values(value).reduce((acc, value) => {
        return acc + value.num
      }, 0),
      symbols: value,
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
})

const transactionsBySymbolAndHour = computed(() => {
  const filterDate = subHours(new Date(), 48)
  const data = transactions.value
    .filter(x => x.time >= filterDate.getTime())
    .reduce((acc, transaction) => {
      const date = format(new Date(transaction.time), 'yyyy-MM-dd HH')
      const symbol = transaction.symbol
      if (!acc[date]) acc[date] = {}
      if (!acc[date][symbol]) acc[date][symbol] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
      if (transaction.incomeType === 'REALIZED_PNL') {
        acc[date][symbol].num++
        acc[date][symbol].pnl += parseFloat(transaction.income)
      } else {
        acc[date][symbol].charges += parseFloat(transaction.income)
      }
      acc[date][symbol].all += parseFloat(transaction.income)
      return acc
    }, {} as Record<string, Record<string, PriceData>>)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({
      key,
      total: Object.values(value).reduce((acc, value) => {
        return acc + value.all
      }, 0),
      num: Object.values(value).reduce((acc, value) => {
        return acc + value.num
      }, 0),
      symbols: value,
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
})

type TradesInfo = {
  openLong: number
  closeLong: number
  openShort: number
  closeShort: number
  currentOpenLong: number
  currentOpenShort: number
}
const tradesInfo = computed(() => {
  let closeLongDetected: Record<string, boolean> = {}
  let closeShortDetected: Record<string, boolean> = {}
  const data: Record<string, TradesInfo> = trades.value.reduce((acc, trade) => {
    if (!usedSymbols.value.includes(trade.symbol)) {
      return acc
    }
    const symbol = trade.symbol
    if (!acc[symbol]) {
      acc[symbol] = {
        openLong: 0,
        closeLong: 0,
        openShort: 0,
        closeShort: 0,
        currentOpenLong: 0,
        currentOpenShort: 0,
      }
    }
    if (trade.positionSide === 'LONG') {
      if (!closeLongDetected[symbol] && parseFloat(trade.realisedPNL) !== 0)
        closeLongDetected[symbol] = true
      if (!closeLongDetected[symbol]) acc[symbol].currentOpenLong++

      if (parseFloat(trade.realisedPNL) === 0) acc[symbol].openLong++
      else acc[symbol].closeLong++
    } else {
      if (!closeShortDetected[symbol] && parseFloat(trade.realisedPNL) !== 0)
        closeShortDetected[symbol] = true
      if (!closeShortDetected[symbol]) acc[symbol].currentOpenShort++

      if (parseFloat(trade.realisedPNL) === 0) acc[symbol].openShort++
      else acc[symbol].closeShort++
    }
    return acc
  }, {} as Record<string, TradesInfo>)

  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort(
      (a, b) =>
        Math.max(b.currentOpenLong, b.currentOpenShort) -
        Math.max(a.currentOpenLong, a.currentOpenShort)
    )
})

const balance = computed(() => {
  return bingXBalanceStore.balance.find(x => x.asset === 'USDT')
})

const parseValue = (value: number | string | undefined) => {
  if (!value) return '---'
  if (typeof value === 'string') return parseFloat(value).toFixed(4)
  return value.toFixed(4)
}

const selectedSymbols = ref(preferencesStore.hidedSymbols)

const usedSymbols = computed(() => {
  return bingXTransactionsStore.allSymbols.filter(x => !selectedSymbols.value.includes(x)).sort()
})

onMounted(async () => {
  await refreshTransactions()
  if (autoRefreshEnabled.value) {
    resume()
  }
})
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-2">
        <h1 class="text-xl font-bold">BingX Transactions</h1>
        <RouterLink
          to="/charts"
          class="px-4 py-1 bg-slate-500 text-white rounded hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
        >
          Charts
        </RouterLink>
      </div>
      <div class="flex gap-2">
        <Listbox v-model="selectedSymbols" multiple>
          <ListboxButton
            class="px-4 py-1 bg-violet-500 text-white rounded hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
          >
            Hide Symbols
          </ListboxButton>
          <ListboxOptions class="bg-slate-600 text-xs absolute top-14 rounded-md py-2">
            <ListboxOption
              v-for="symbol in bingXTransactionsStore.allSymbols"
              v-model="selectedSymbols"
              :key="symbol"
              :value="symbol"
              class="px-4 py-0.5 hover:bg-slate-700 cursor-pointer"
              v-slot="{ selected }"
            >
              <li
                class="relative"
                :class="{
                  'font-bold text-slate-800/80 ': selected,
                  '': !selected,
                }"
              >
                {{ symbol.replace('-USDT', '') }}
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Listbox>
        <button
          @click="toggleAutoRefresh"
          class="px-4 py-1 rounded transition"
          :class="autoRefreshEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'"
        >
          Auto-refresh: {{ autoRefreshEnabled ? 'ON' : 'OFF' }}
        </button>
        <button
          @click="refreshTransactions"
          class="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
          :disabled="isRefreshing || bingXTransactionsStore.loading"
        >
          <span v-if="isRefreshing || bingXTransactionsStore.loading">Refreshing...</span>
          <span v-else>Refresh Transactions</span>
        </button>
        <button
          @click="bingXConfig.toggleViewConfig"
          class="px-4 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition"
        >
          <span>Config</span>
        </button>
      </div>
    </div>

    <div v-if="bingXTransactionsStore.loading && !transactions.length" class="text-gray-600">
      Loading transactions...
    </div>

    <div v-else-if="bingXTransactionsStore.error" class="text-red-500">
      Error: {{ bingXTransactionsStore.error }}
    </div>

    <div v-else-if="bingXTransactionsStore.transactions.length === 0" class="text-gray-600">
      No transactions found.
    </div>
    <div v-else class="flex flex-col gap-4">
      <!-- <div>
        <Chart :symbols="allSymbols" :data="transactionsBySymbolAndDay" />
      </div> -->
      <div class="grid grid-cols-6 gap-4">
        <Table :headers="['Key', 'Value']" :items="[]">
          <template #tbody>
            <tr
              v-for="[key, value] in Object.entries({
                numDays: differenceInDays(
                  new Date(),
                  startOfDay(new Date(transactions[transactions.length - 1].time))
                ),
                transfer: parseValue(totalIncomeTransactions),
                profit: balance ? parseFloat(balance.balance) - totalIncomeTransactions : '---',
                profitByDay: balance
                  ? (parseFloat(balance.balance) - totalIncomeTransactions) /
                    differenceInDays(
                      new Date(),
                      startOfDay(new Date(transactions[transactions.length - 1].time))
                    )
                  : '---',
                balance: balance?.balance,
                equity: balance?.equity,
                unrealizedProfit: balance?.unrealizedProfit,
                realisedProfit: balance?.realisedProfit,
                availableMargin: balance?.availableMargin,
                usedMargin: balance?.usedMargin,
                freezedMargin: balance?.freezedMargin,
              })"
              :key="key"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
            >
              <td class="px-2 py-0.5">{{ key }}</td>
              <td class="px-2 py-0.5">
                <Price
                  :value="value"
                  :color="
                    key === 'profitByDay' ? 'violet' : key === 'profit' ? 'orange' : undefined
                  "
                />
              </td>
            </tr>
          </template>
        </Table>
        <Table :headers="['symbol', 'Long', 'Short']" :items="tradesInfo">
          <template #default="{ item }">
            <td class="px-2 py-0.5">{{ item.key.replace('-USDT', '') }}</td>
            <td class="px-2 py-0.5">
              <div class="flex gap-0.5">
                <span class="text-amber-400">{{ item.openLong }}</span>
                <span class="text-slate-600">/</span>
                <span class="text-lime-400">{{ item.closeLong }}</span>
                <span class="text-slate-600">/</span>
                <span
                  :class="{
                    'text-slate-400': item.currentOpenLong === 0,
                    'text-violet-400': item.currentOpenLong > 0 && item.currentOpenLong < 13,
                    'text-rose-400': item.currentOpenLong >= 13,
                  }"
                  >{{ item.currentOpenLong }}</span
                >
              </div>
            </td>
            <td class="px-2 py-0.5">
              <div class="flex gap-0.5">
                <span class="text-amber-400">{{ item.openShort }}</span>
                <span class="text-slate-600">/</span>
                <span class="text-lime-400">{{ item.closeShort }}</span>
                <span class="text-slate-600">/</span>
                <span
                  :class="{
                    'text-slate-400': item.currentOpenShort === 0,
                    'text-violet-400': item.currentOpenShort > 0 && item.currentOpenShort < 13,
                    'text-rose-400': item.currentOpenShort >= 13,
                  }"
                  >{{ item.currentOpenShort }}</span
                >
              </div>
            </td>
          </template>
        </Table>
        <Table
          :headers="['symbol', 'num', 'volume', 'income', 'charges', 'profit', 'prof%']"
          :items="transactionsBySymbol"
          class="col-span-2"
        >
          <template #default="{ item }">
            <td class="px-2 py-0.5">{{ item.key.replace('-USDT', '') }}</td>
            <td class="px-2 py-0.5">{{ item.num }}</td>
            <td class="px-2 py-0.5"><Price :value="item.volume" color="orange" /></td>
            <td class="px-2 py-0.5"><Price :value="item.pnl" /></td>
            <td class="px-2 py-0.5"><Price :value="item.charges" /></td>
            <td class="px-2 py-0.5"><Price :value="item.all" /></td>
            <td class="px-2 py-0.5">{{ ((item.all * 100) / item.volume).toFixed(2) }}%</td>
          </template>
        </Table>
        <Table
          :headers="['Date', 'num', 'volume', 'income', 'charges', 'profit', 'prof%', 'USDT/hour']"
          :items="transactionsByDay"
          class="col-span-2"
        >
          <template #default="{ item }">
            <td class="px-2 py-0.5">{{ item.key }}</td>
            <td class="px-2 py-0.5">{{ item.num }}</td>
            <td class="px-2 py-0.5"><Price :value="item.volume" color="orange" /></td>
            <td class="px-2 py-0.5"><Price :value="item.pnl" /></td>
            <td class="px-2 py-0.5"><Price :value="item.charges" /></td>
            <td class="px-2 py-0.5"><Price :value="item.all" /></td>
            <td class="px-2 py-0.5">
              <template v-if="item.volume !== 0">
                {{ ((item.all * 100) / item.volume).toFixed(2) }}%
              </template>
              <template v-else> - </template>
            </td>
            <td class="px-2 py-0.5">
              <Price
                :value="
                  item.all /
                  (new Date(item.key).getTime() < startOfDay(new Date()).getTime()
                    ? 24
                    : differenceInHours(new Date(), startOfDay(new Date())))
                "
                color="violet"
              />
            </td>
          </template>
        </Table>
      </div>
      <Table
        :headers="['date', 'total', ...usedSymbols.map(x => x.replace('-USDT', ''))]"
        :items="transactionsBySymbolAndDay"
      >
        <template #default="{ item }">
          <td class="px-2 py-0.5">{{ item.key }}</td>
          <td class="px-2 py-0.5 bg-slate-900">
            <Price :value="item.total" />
            <NumTrades :num="item.num" />
          </td>
          <td v-for="symbol in usedSymbols" :key="symbol" class="px-2 py-0.5 whitespace-nowrap">
            <template v-if="item.symbols[symbol]">
              <Price :value="item.symbols[symbol].all" />
              <NumTrades :num="item.symbols[symbol].num" />
            </template>
            <template v-else> - </template>
          </td>
        </template>
      </Table>
      <Table
        :headers="['date', 'total', ...usedSymbols.map(x => x.replace('-USDT', ''))]"
        :items="transactionsBySymbolAndHour"
        fullHeight
      >
        <template #default="{ item }">
          <td class="px-2 py-0.5">{{ item.key }}</td>
          <td class="px-2 py-0.5 bg-slate-900">
            <Price :value="item.total" />
            <NumTrades :num="item.num" />
          </td>
          <td v-for="symbol in usedSymbols" :key="symbol" class="px-2 py-0.5 whitespace-nowrap">
            <template v-if="item.symbols[symbol]">
              <div>
                <Price :value="item.symbols[symbol].all" />
                <NumTrades :num="item.symbols[symbol].num" />
              </div>
            </template>
            <template v-else> - </template>
          </td>
        </template>
      </Table>
    </div>
  </div>
</template>
