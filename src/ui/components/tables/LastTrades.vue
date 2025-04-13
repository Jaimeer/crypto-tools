<script setup lang="ts">
import { computed } from "vue";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import { useBingXTradesStore } from "../../store/bingxTrades.store";
import Price from "../Price.vue";
import Table from "../Table.vue";
import Symbol from "../Symbol.vue";
import DateTime from "../DateTime.vue";

const bingXTradesStore = useBingXTradesStore();
const bingXTransactionsStore = useBingXTransactionsStore();

type PriceData = {
  num: number;
  pnl: number;
  all: number;
  charges: number;
  volume: number;
};

const transactions = computed(() => {
  return bingXTransactionsStore.transactions.filter((x) => x.symbol);
});

const lastClosedTransactions = computed(() => {
  return transactions.value
    .filter((transaction) => {
      return transaction.incomeType === "REALIZED_PNL";
    })
    .slice(0, 30);
});
</script>

<template>
  <Table :headers="['Date', 'symbol', 'pnl']" :items="lastClosedTransactions">
    <template #default="{ item }">
      <td class="px-2 py-0.5"><DateTime :value="new Date(item.time)" /></td>
      <td class="px-2 py-0.5"><Symbol :value="item.symbol" /></td>
      <td class="px-2 py-0.5">
        <Price :value="item.income" :decimals="2" />
      </td>
    </template>
  </Table>
</template>
