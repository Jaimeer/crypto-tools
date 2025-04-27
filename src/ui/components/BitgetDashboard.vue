<script setup lang="ts">
import { computed } from "vue";
import { useBitgetBalanceStore } from "../store/bitget/bitgetBalance.store";
import { useBitkuaBotsStore } from "../store/bitkua/bitkuaBots.store";
import { useBitgetTransactionsStore } from "../store/bitget/bitgetTransactions.store";
import { useBitgetPositionsStore } from "../store/bitget/bitgetPositions.store";

import ProfitByDay from "./tables/ProfitByDay.vue";
import Balance from "./tables/Balance.vue";
import SymbolTrades from "./tables/SymbolTrades.vue";
import SymbolTransactions from "./tables/SymbolTransactions.vue";
import LastTrades from "./tables/LastTrades.vue";
import TheHeader from "./TheHeader.vue";
import ProfitRanking from "./tables/ProfitRanking.vue";
import { Transaction } from "src/server/data.dto";

const exchange = "Bitget";
const bitgetTransactionsStore = useBitgetTransactionsStore();
const bitgetBalanceStore = useBitgetBalanceStore();
const bitkuaBotsStore = useBitkuaBotsStore();
const bitgetPositionsStore = useBitgetPositionsStore();

const transactions = computed(() => {
  return [] as unknown as Transaction[];
  return bitgetTransactionsStore.transactions.filter((x) => x.symbol);
});

const incomeTransactions = computed(() => {
  return bitgetTransactionsStore.transactions.filter((x) => !x.symbol);
});

const bots = computed(() => {
  return bitkuaBotsStore.bots.filter((x) => x.exchange === exchange);
});

const balance = computed(() => {
  console.log({ b: bitgetBalanceStore.balance });
  return bitgetBalanceStore.balance;
});

const positions = computed(() => {
  return bitgetPositionsStore.positions;
});
</script>

<template>
  <div class="p-4">
    <TheHeader page="bitget" />

    <div v-if="transactions.length === 0" class="text-gray-600">
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
        <!-- <ProfitByDay class="col-span-2" />
        <LastTrades />
        <ProfitRanking /> -->
      </div>
      <div class="">
        <!-- <SymbolTrades exchange="bitget" /> -->
      </div>
      <!-- <SymbolTransactions date-format="yyyy-MM-dd" /> -->
      <!-- <SymbolTransactions date-format="yyyy-MM-dd HH" /> -->
    </div>
  </div>
</template>
