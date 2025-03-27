<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { differenceInDays, differenceInHours, format, startOfDay, subHours } from 'date-fns'
import { useBingXTransactionsStore } from '../store/bingxTransactions.store'
import { useBingXBalanceStore } from '../store/bingxBalance.store'
import Chart from './Chart.vue'
import Price from './Price.vue'
import Table from './Table.vue'
import NumTrades from './NumTrades.vue'
import { useIntervalFn } from '@vueuse/core'
import { useBingXConfigStore } from '../store/bingxConfig.store'
import { usePreferencesStore } from '../store/preferences.store'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'

const bingXConfig = useBingXConfigStore()
const bingXTransactionsStore = useBingXTransactionsStore()
const bingXBalanceStore = useBingXBalanceStore()
const preferencesStore = usePreferencesStore()
const isRefreshing = ref(false)
const autoRefreshEnabled = ref(true)

type PriceData = { num: number; value: number; all: number; charges: number }

const refreshTransactions = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await bingXTransactionsStore.fetchTransactions()
    await bingXBalanceStore.fetchBalance()
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

const tradeTransactions = computed(() => {
  return bingXTransactionsStore.transactions.filter(x => x.symbol)
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
  const data = tradeTransactions.value.reduce((acc, transaction) => {
    if (!acc[transaction.symbol]) {
      acc[transaction.symbol] = { num: 0, value: 0, all: 0, charges: 0 }
    }
    if (transaction.incomeType === 'REALIZED_PNL') {
      acc[transaction.symbol].num++
      acc[transaction.symbol].value += parseFloat(transaction.income)
    } else {
      acc[transaction.symbol].charges += parseFloat(transaction.income)
    }
    acc[transaction.symbol].all += parseFloat(transaction.income)
    return acc
  }, {} as Record<string, PriceData>)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.value - a.value)
})

const transactionsByDay = computed(() => {
  const data = tradeTransactions.value.reduce((acc, transaction) => {
    const date = format(new Date(transaction.time), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = { num: 0, value: 0, all: 0, charges: 0 }
    }
    if (transaction.incomeType === 'REALIZED_PNL') {
      acc[date].num++
      acc[date].value += parseFloat(transaction.income)
    } else {
      acc[date].charges += parseFloat(transaction.income)
    }
    acc[date].all += parseFloat(transaction.income)
    return acc
  }, {} as Record<string, PriceData>)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.key.localeCompare(a.key))
})

const transactionsBySymbolAndDay = computed(() => {
  const data = tradeTransactions.value.reduce((acc, transaction) => {
    const date = format(new Date(transaction.time), 'yyyy-MM-dd')
    const symbol = transaction.symbol
    if (!acc[date]) acc[date] = {}
    if (!acc[date][symbol]) acc[date][symbol] = { num: 0, value: 0, all: 0, charges: 0 }
    if (transaction.incomeType === 'REALIZED_PNL') {
      acc[date][symbol].num++
      acc[date][symbol].value += parseFloat(transaction.income)
    } else {
      acc[date][symbol].charges += parseFloat(transaction.income)
    }
    acc[date][symbol].all += parseFloat(transaction.income)
    return acc
  }, {} as Record<string, Record<string, PriceData>>)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, symbols: value }))
    .sort((a, b) => b.key.localeCompare(a.key))
})

const transactionsBySymbolAndHour = computed(() => {
  const filterDate = subHours(new Date(), 48)
  const data = tradeTransactions.value
    .filter(x => x.time >= filterDate.getTime())
    .reduce((acc, transaction) => {
      const date = format(new Date(transaction.time), 'yyyy-MM-dd HH')
      const symbol = transaction.symbol
      if (!acc[date]) acc[date] = {}
      if (!acc[date][symbol]) acc[date][symbol] = { num: 0, value: 0, all: 0, charges: 0 }
      if (transaction.incomeType === 'REALIZED_PNL') {
        acc[date][symbol].num++
        acc[date][symbol].value += parseFloat(transaction.income)
      } else {
        acc[date][symbol].charges += parseFloat(transaction.income)
      }
      acc[date][symbol].all += parseFloat(transaction.income)
      return acc
    }, {} as Record<string, Record<string, PriceData>>)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, symbols: value }))
    .sort((a, b) => b.key.localeCompare(a.key))
})

const allSymbols = computed(() => {
  return [...new Set(tradeTransactions.value.map(x => x.symbol))]
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
  return allSymbols.value.filter(x => !selectedSymbols.value.includes(x)).sort()
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
      <h1 class="text-xl font-bold">BingX Transactions</h1>
      <div class="flex gap-2">
        <Listbox v-model="selectedSymbols" multiple>
          <ListboxButton
            class="px-4 py-1 bg-violet-500 text-white rounded hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
          >
            Hide Symbols
          </ListboxButton>
          <ListboxOptions class="bg-slate-600 text-xs absolute top-14 rounded-md py-2">
            <ListboxOption
              v-for="symbol in allSymbols"
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

    <div v-if="bingXTransactionsStore.loading && !tradeTransactions.length" class="text-gray-600">
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
      <div class="grid grid-cols-3 gap-4">
        <table
          class="w-full text-xs text-left rtl:text-right text-gray-500 dark:text-gray-400 overflow-y-auto"
        >
          <tbody>
            <tr
              v-for="[key, value] in Object.entries({
                numDays: differenceInDays(
                  new Date(),
                  startOfDay(new Date(tradeTransactions[tradeTransactions.length - 1].time))
                ),
                transfer: parseValue(totalIncomeTransactions),
                profit: balance ? parseFloat(balance.balance) - totalIncomeTransactions : '---',
                profitByDay: balance
                  ? (parseFloat(balance.balance) - totalIncomeTransactions) /
                    differenceInDays(
                      new Date(),
                      startOfDay(new Date(tradeTransactions[tradeTransactions.length - 1].time))
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
              <td class="px-2 py-0.5"><Price :value="value" color /></td>
            </tr>
          </tbody>
        </table>
        <Table
          :headers="['symbol', 'num', 'income', 'charges', 'profit']"
          :items="transactionsBySymbol"
        >
          <template #default="{ item }">
            <td class="px-2 py-0.5">{{ item.key }}</td>
            <td class="px-2 py-0.5">{{ item.num }}</td>
            <td class="px-2 py-0.5"><Price :value="item.value" color /></td>
            <td class="px-2 py-0.5"><Price :value="item.charges" color /></td>
            <td class="px-2 py-0.5"><Price :value="item.all" color /></td>
          </template>
        </Table>
        <Table
          :headers="['Date', 'num', 'income', 'charges', 'profit', 'USDT/hour']"
          :items="transactionsByDay"
        >
          <template #default="{ item }">
            <td class="px-2 py-0.5">{{ item.key }}</td>
            <td class="px-2 py-0.5">{{ item.num }}</td>
            <td class="px-2 py-0.5"><Price :value="item.value" color /></td>
            <td class="px-2 py-0.5"><Price :value="item.charges" color /></td>
            <td class="px-2 py-0.5"><Price :value="item.all" color /></td>
            <td class="px-2 py-0.5">
              <Price
                :value="
                  item.all /
                  (new Date(item.key).getTime() < startOfDay(new Date()).getTime()
                    ? 24
                    : differenceInHours(new Date(), startOfDay(new Date())))
                "
                color
              />
            </td>
          </template>
        </Table>
      </div>
      <Table
        :headers="['date', ...usedSymbols.map(x => x.replace('-USDT', ''))]"
        :items="transactionsBySymbolAndDay"
      >
        <template #default="{ item }">
          <td class="px-2 py-0.5">{{ item.key }}</td>
          <td v-for="symbol in usedSymbols" :key="symbol" class="px-2 py-0.5 whitespace-nowrap">
            <template v-if="item.symbols[symbol]">
              <Price :value="item.symbols[symbol].all" color />
              <NumTrades :num="item.symbols[symbol].num" color />
            </template>
            <template v-else> - </template>
          </td>
        </template>
      </Table>
      <Table
        :headers="['date', ...usedSymbols.map(x => x.replace('-USDT', ''))]"
        :items="transactionsBySymbolAndHour"
        fullHeight
      >
        <template #default="{ item }">
          <td class="px-2 py-0.5">{{ item.key }}</td>
          <td v-for="symbol in usedSymbols" :key="symbol" class="px-2 py-0.5 whitespace-nowrap">
            <template v-if="item.symbols[symbol]">
              <Price :value="item.symbols[symbol].all" color />
              <NumTrades :num="item.symbols[symbol].num" color />
            </template>
            <template v-else> - </template>
          </td>
        </template>
      </Table>
    </div>
  </div>
</template>
