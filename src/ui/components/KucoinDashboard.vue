<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useKucoinTransactionsStore } from '../store/kucoin/kucoinTransactions.store'
import { useKucoinBalanceStore } from '../store/kucoin/kucoinBalance.store'
import { useBitkuaBotsStore } from '../store/bitkua/bitkuaBots.store'
import { useKucoinPositionsStore } from '../store/kucoin/kucoinPositions.store'
import { useKucoinTradesStore } from '../store/kucoin/kucoinTrades.store'
import { useKucoinContractsStore } from '../store/kucoin/kucoinContracts.store'
import { useKucoinPreferencesStore } from '../store/kucoin/kucoinPreferences.store'

import ProfitByDay from './tables/ProfitByDay.vue'
import Balance from './tables/Balance.vue'
import SymbolTrades from './tables/SymbolTrades.vue'
import SymbolTransactions from './tables/SymbolTransactions.vue'
import LastTrades from './tables/LastTrades.vue'
import TheHeader from './general/TheHeader.vue'
import ProfitRanking from './tables/ProfitRanking.vue'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import BingxChartManager from './trading/BingxChartManager.vue'

const exchange = 'kucoin'
const kucoinTransactionsStore = useKucoinTransactionsStore()
const kucoinBalanceStore = useKucoinBalanceStore()
const bitkuaBotsStore = useBitkuaBotsStore()
const kucoinPositionsStore = useKucoinPositionsStore()
const kucoinTradesStore = useKucoinTradesStore()
const kucoinContractsStore = useKucoinContractsStore()
const kucoinPreferencesStore = useKucoinPreferencesStore()

const search = ref('')

const transactions = computed(() => {
  return kucoinTransactionsStore.transactions.filter((x) => x.symbol)
})

const incomeTransactions = computed(() => {
  return kucoinTransactionsStore.transactions.filter((x) => !x.symbol)
})

const bots = computed(() => {
  return bitkuaBotsStore.bots.filter(
    (x) => x.exchange.toLowerCase() === exchange.toLowerCase(),
  )
})

const balance = computed(() => {
  return kucoinBalanceStore.balance
})

const positions = computed(() => {
  return kucoinPositionsStore.positions
})

const trades = computed(() => {
  return kucoinTradesStore.trades
})

const contracts = computed(() => {
  return kucoinContractsStore.contracts
})

const allSymbols = computed(() => {
  return kucoinTransactionsStore.allSymbols
})

const hidedSymbols = computed(() => {
  return kucoinPreferencesStore.hidedSymbols
})

const selectedSymbols = ref(kucoinPreferencesStore.hidedSymbols)

const cleanHidedSymbols = () => {
  selectedSymbols.value = []
}

watch(selectedSymbols, () => {
  kucoinPreferencesStore.hidedSymbols = selectedSymbols.value
})
</script>

<template>
  <div class="p-4">
    <TheHeader :page="exchange" v-model="search">
      <template #right>
        <Listbox v-model="selectedSymbols" multiple>
          <ListboxButton
            class="rounded bg-violet-500 px-4 py-1 text-white transition hover:bg-violet-600"
          >
            Hide Symbols
            <span v-if="selectedSymbols.length" class="text-slate-300">
              ({{ selectedSymbols.length }})
            </span>
          </ListboxButton>
          <ListboxOptions
            class="absolute top-14 right-4 z-10 rounded bg-slate-600 p-1 text-xs"
          >
            <ListboxOption
              class="mb-1 cursor-pointer border border-slate-500 bg-slate-600 px-4 py-0.5 text-center hover:bg-slate-700"
              @click="cleanHidedSymbols"
            >
              Active all
            </ListboxOption>

            <div class="grid grid-cols-4 gap-1">
              <ListboxOption
                v-for="symbol in kucoinTransactionsStore.allSymbols.sort()"
                v-model="selectedSymbols"
                :key="symbol"
                :value="symbol"
                class="relative cursor-pointer border border-slate-500 bg-slate-600 hover:bg-slate-700"
                v-slot="{ selected }"
              >
                <li
                  class="px-4 py-0.5"
                  :class="{
                    'bg-slate-700 font-bold text-slate-400': selected,
                    'bg-slate-600': !selected,
                  }"
                >
                  {{ symbol.replace('USDT', '') }}
                </li>
              </ListboxOption>
            </div>
          </ListboxOptions>
        </Listbox>
      </template>
    </TheHeader>

    <div v-if="transactions.length === 0" class="text-gray-600">
      No transactions found.
    </div>
    <div v-else class="flex flex-col gap-2">
      <div class="grid grid-cols-5 gap-2">
        <Balance
          :transactions="transactions"
          :incomeTransactions="incomeTransactions"
          :positions="positions"
          :balance="balance"
          :bots="bots"
        />
        <ProfitByDay
          class="col-span-2"
          :exchange="exchange"
          :trades="trades"
          :transactions="transactions"
        />
        <LastTrades
          :exchange="exchange"
          :trades="trades"
          :positions="positions"
          :balance="balance"
          :bots="bots"
          :contracts="contracts"
          :transactions="transactions"
          :search="search"
        />
        <ProfitRanking
          :exchange="exchange"
          :trades="trades"
          :positions="positions"
          :balance="balance"
          :bots="bots"
          :contracts="contracts"
          :transactions="transactions"
          :hidedSymbols="hidedSymbols"
          :search="search"
        />
      </div>
      <div class="">
        <SymbolTrades
          :exchange="exchange"
          :trades="trades"
          :positions="positions"
          :balance="balance"
          :bots="bots"
          :contracts="contracts"
          :transactions="transactions"
          :allSymbols="allSymbols"
          :hidedSymbols="hidedSymbols"
          :search="search"
        />
      </div>
      <SymbolTransactions
        date-format="yyyy-MM-dd"
        :exchange="exchange"
        :trades="trades"
        :positions="positions"
        :balance="balance"
        :bots="bots"
        :contracts="contracts"
        :transactions="transactions"
        :allSymbols="allSymbols"
        :hidedSymbols="hidedSymbols"
        :search="search"
      />
      <!-- <SymbolTransactions date-format="yyyy-MM-dd HH" /> -->

    </div>
  </div>
</template>
