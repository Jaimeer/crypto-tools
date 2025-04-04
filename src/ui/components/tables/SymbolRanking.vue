<script setup lang="ts">
import { computed, ref } from "vue";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import Price from "../Price.vue";
import Table from "../Table.vue";
import { useBingXTradesStore } from "../../store/bingxTrades.store";
import { usePreferencesStore } from "../../store/preferences.store";

const bingXTradesStore = useBingXTradesStore();
const bingXTransactionsStore = useBingXTransactionsStore();
const preferencesStore = usePreferencesStore();

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

const trades = computed(() => {
  return bingXTradesStore.trades;
});

const usedSymbols = computed(() => {
  return bingXTransactionsStore.allSymbols
    .filter((x) => !preferencesStore.hidedSymbols.includes(x))
    .sort();
});

const transactionsBySymbol = computed(() => {
  const data = transactions.value.reduce(
    (acc, transaction) => {
      if (!usedSymbols.value.includes(transaction.symbol)) {
        return acc;
      }
      if (!acc[transaction.symbol]) {
        acc[transaction.symbol] = {
          num: 0,
          pnl: 0,
          all: 0,
          charges: 0,
          volume: 0,
        };
      }
      if (transaction.incomeType === "REALIZED_PNL") {
        acc[transaction.symbol].num++;
        acc[transaction.symbol].pnl += parseFloat(transaction.income);
      } else {
        acc[transaction.symbol].charges += parseFloat(transaction.income);
      }
      acc[transaction.symbol].all += parseFloat(transaction.income);
      return acc;
    },
    {} as Record<string, PriceData>,
  );

  trades.value.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 };
    }
    if (parseFloat(trade.realisedPNL) !== 0) return acc;
    acc[trade.symbol].volume += parseFloat(trade.quoteQty);
    return acc;
  }, data);

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.all - a.all);
});
</script>

<template>
  <Table
    :headers="[
      'symbol',
      'num',
      'volume',
      'income',
      'charges',
      'profit',
      'prof%',
    ]"
    :items="transactionsBySymbol"
    class="col-span-2"
  >
    <template #default="{ item }">
      <td class="px-2 py-0.5">{{ item.key.replace("-USDT", "") }}</td>
      <td class="px-2 py-0.5">{{ item.num }}</td>
      <td class="px-2 py-0.5">
        <Price :value="item.volume" color="orange" />
      </td>
      <td class="px-2 py-0.5"><Price :value="item.pnl" /></td>
      <td class="px-2 py-0.5"><Price :value="item.charges" /></td>
      <td class="px-2 py-0.5"><Price :value="item.all" /></td>
      <td class="px-2 py-0.5">
        <template v-if="item.volume !== 0">
          {{ ((item.all * 100) / item.volume).toFixed(2) }}%
        </template>
        <template v-else> - </template>
      </td>
    </template>
  </Table>
</template>
