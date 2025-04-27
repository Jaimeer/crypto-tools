<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useBingXTransactionsStore } from "../store/bingx/bingxTransactions.store";
import { useBingXBalanceStore } from "../store/bingx/bingxBalance.store";
import { useBitkuaBotsStore } from "../store/bitkua/bitkuaBots.store";
import { useBingXPositionsStore } from "../store/bingx/bingxPositions.store";
import { useBingXTradesStore } from "../store/bingx/bingxTrades.store";
import { useBingXContractsStore } from "../store/bingx/bingxContracts.store";
import { useBingxPreferencesStore } from "../store/bingx/bingxPreferences.store";

import ProfitByDay from "./tables/ProfitByDay.vue";
import Balance from "./tables/Balance.vue";
import SymbolTrades from "./tables/SymbolTrades.vue";
import SymbolTransactions from "./tables/SymbolTransactions.vue";
import LastTrades from "./tables/LastTrades.vue";
import TheHeader from "./TheHeader.vue";
import ProfitRanking from "./tables/ProfitRanking.vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";

const exchange = "Bingx";
const bingxTransactionsStore = useBingXTransactionsStore();
const bingxBalanceStore = useBingXBalanceStore();
const bitkuaBotsStore = useBitkuaBotsStore();
const bingxPositionsStore = useBingXPositionsStore();
const bingxTradesStore = useBingXTradesStore();
const bingXContractsStore = useBingXContractsStore();
const bingxPreferencesStore = useBingxPreferencesStore();

const transactions = computed(() => {
  return bingxTransactionsStore.transactions.filter((x) => x.symbol);
});

const incomeTransactions = computed(() => {
  return bingxTransactionsStore.transactions.filter((x) => !x.symbol);
});

const bots = computed(() => {
  return bitkuaBotsStore.bots.filter((x) => x.exchange === exchange);
});

const balance = computed(() => {
  return bingxBalanceStore.balance;
});

const positions = computed(() => {
  return bingxPositionsStore.positions;
});

const trades = computed(() => {
  return bingxTradesStore.trades;
});

const contracts = computed(() => {
  return bingXContractsStore.contracts;
});

const allSymbols = computed(() => {
  return bingxTransactionsStore.allSymbols;
});

const hidedSymbols = computed(() => {
  return bingxPreferencesStore.hidedSymbols;
});

const selectedSymbols = ref(bingxPreferencesStore.hidedSymbols);

const cleanHidedSymbols = () => {
  selectedSymbols.value = [];
};

watch(selectedSymbols, () => {
  bingxPreferencesStore.hidedSymbols = selectedSymbols.value;
});
</script>

<template>
  <div class="p-4">
    <TheHeader page="bingx">
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

            <div class="grid grid-cols-2 gap-1">
              <ListboxOption
                v-for="symbol in bingxTransactionsStore.allSymbols.sort()"
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
                  {{ symbol.replace("-USDT", "") }}
                </li>
              </ListboxOption>
            </div>
          </ListboxOptions>
        </Listbox>
      </template>
    </TheHeader>

    <div
      v-if="bingxTransactionsStore.loading && !transactions.length"
      class="text-gray-600"
    >
      Loading transactions...
    </div>

    <div v-else-if="bingxTransactionsStore.error" class="text-red-500">
      Error: {{ bingxTransactionsStore.error }}
    </div>

    <div
      v-else-if="bingxTransactionsStore.transactions.length === 0"
      class="text-gray-600"
    >
      No transactions found.
    </div>
    <div v-else class="flex flex-col gap-2">
      <!-- <div>
        <Chart :symbols="allSymbols" :data="transactionsBySymbolAndDay" />
      </div> -->
      <div class="grid grid-cols-5 gap-2">
        <Balance
          :transactions="transactions"
          :incomeTransactions="incomeTransactions"
          :positions="positions"
          :balance="balance"
          :bots="bots"
        />
        <ProfitByDay class="col-span-2" />
        <LastTrades
          :exchange="exchange"
          :trades="trades"
          :positions="positions"
          :balance="balance"
          :bots="bots"
          :contracts="contracts"
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
      />
      <!-- <SymbolTransactions date-format="yyyy-MM-dd HH" /> -->
    </div>
  </div>
</template>
