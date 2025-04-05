<script setup lang="ts">
import { computed } from "vue";
import { useBingXTransactionsStore } from "../store/bingxTransactions.store";

import ProfitByDay from "./tables/ProfitByDay.vue";
import Balance from "./tables/Balance.vue";
import SymbolTrades from "./tables/SymbolTrades.vue";
import SymbolTransactions from "./tables/SymbolTransactions.vue";
import TheHeader from "./TheHeader.vue";

const bingXTransactionsStore = useBingXTransactionsStore();

const transactions = computed(() => {
  return bingXTransactionsStore.transactions.filter((x) => x.symbol);
});
</script>

<template>
  <div class="p-4">
    <TheHeader />

    <div
      v-if="bingXTransactionsStore.loading && !transactions.length"
      class="text-gray-600"
    >
      Loading transactions...
    </div>

    <div v-else-if="bingXTransactionsStore.error" class="text-red-500">
      Error: {{ bingXTransactionsStore.error }}
    </div>

    <div
      v-else-if="bingXTransactionsStore.transactions.length === 0"
      class="text-gray-600"
    >
      No transactions found.
    </div>
    <div v-else class="flex flex-col gap-2">
      <!-- <div>
        <Chart :symbols="allSymbols" :data="transactionsBySymbolAndDay" />
      </div> -->
      <div class="grid grid-cols-4 gap-2">
        <Balance />
        <ProfitByDay class="col-span-3" />
      </div>
      <div class="">
        <SymbolTrades />
      </div>
      <SymbolTransactions date-format="yyyy-MM-dd" />
      <SymbolTransactions date-format="yyyy-MM-dd HH" />
    </div>
  </div>
</template>
