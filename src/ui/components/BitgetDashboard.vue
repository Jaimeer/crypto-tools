<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBitkuaBotsStore } from '../store/bitkua/bitkuaBots.store'
import { useBitgetBalanceStore } from '../store/bitget/bitgetBalance.store'
import { useBitgetTransactionsStore } from '../store/bitget/bitgetTransactions.store'
import { useBitgetPositionsStore } from '../store/bitget/bitgetPositions.store'
import { useBitgetPreferencesStore } from '../store/bitget/bitgetPreferences.store'

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
import { useBitgetContractsStore } from '../store/bitget/bitgetContracts.store'

const exchange = 'bitget'
const bitgetTransactionsStore = useBitgetTransactionsStore()
const bitgetBalanceStore = useBitgetBalanceStore()
const bitkuaBotsStore = useBitkuaBotsStore()
const bitgetPositionsStore = useBitgetPositionsStore()
const bitgetPreferencesStore = useBitgetPreferencesStore()
const bitgetContractsStore = useBitgetContractsStore()

const search = ref('')

const transactions = computed(() => {
  return bitgetTransactionsStore.transactions.filter((x) => x.symbol)
})

const incomeTransactions = computed(() => {
  return bitgetTransactionsStore.transactions.filter((x) => !x.symbol)
})

const trades = computed(() => {
  return [] //bitgetTradesStore.trades
})

const bots = computed(() => {
  return bitkuaBotsStore.bots.filter(
    (x) => x.exchange.toLowerCase() === exchange.toLowerCase(),
  )
})

const balance = computed(() => {
  return bitgetBalanceStore.balance
})

const positions = computed(() => {
  return bitgetPositionsStore.positions ?? []
})

const contracts = computed(() => {
  return bitgetContractsStore.contracts ?? []
})

const allSymbols = computed(() => {
  return bitgetTransactionsStore.allSymbols
})

const hidedSymbols = computed(() => {
  return bitgetPreferencesStore.hidedSymbols
})

const selectedSymbols = ref(bitgetPreferencesStore.hidedSymbols)

const cleanHidedSymbols = () => {
  selectedSymbols.value = []
}

watch(selectedSymbols, () => {
  bitgetPreferencesStore.hidedSymbols = selectedSymbols.value
})
</script>

<template>
  <div class="p-4">
    <TheHeader :page="exchange">
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
                v-for="symbol in bitgetTransactionsStore.allSymbols.sort()"
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
  </div>
</template>
