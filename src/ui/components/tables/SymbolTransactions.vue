<script setup lang="ts">
import { computed, ref } from "vue";
import { format } from "date-fns";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import Price from "../Price.vue";
import Table from "../Table.vue";
import NumTrades from "../NumTrades.vue";
import { usePreferencesStore } from "../../store/preferences.store";

const bingXTransactionsStore = useBingXTransactionsStore();
const preferencesStore = usePreferencesStore();

const props = defineProps<{ dateFormat: string }>();

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

const transactionsBySymbol = computed(() => {
  const data = transactions.value.reduce(
    (acc, transaction) => {
      const date = format(new Date(transaction.time), props.dateFormat);
      const symbol = transaction.symbol;
      if (!acc[date]) acc[date] = {};
      if (!acc[date][symbol])
        acc[date][symbol] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 };
      if (transaction.incomeType === "REALIZED_PNL") {
        acc[date][symbol].num++;
        acc[date][symbol].pnl += parseFloat(transaction.income);
      } else {
        acc[date][symbol].charges += parseFloat(transaction.income);
      }
      acc[date][symbol].all += parseFloat(transaction.income);
      return acc;
    },
    {} as Record<string, Record<string, PriceData>>,
  );

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({
      key,
      total: Object.values(value).reduce((acc, value) => {
        return acc + value.all;
      }, 0),
      num: Object.values(value).reduce((acc, value) => {
        return acc + value.num;
      }, 0),
      symbols: value,
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
});

const usedSymbols = computed(() => {
  return bingXTransactionsStore.allSymbols
    .filter((x) => !preferencesStore.hidedSymbols.includes(x))
    .sort();
});
</script>

<template>
  <Table
    :headers="[
      'date',
      'total',
      ...usedSymbols.map((x) => x.replace('-USDT', '')),
    ]"
    :items="transactionsBySymbol"
  >
    <template #default="{ item }">
      <td class="px-2 py-0.5">{{ item.key }}</td>
      <td class="bg-slate-900 px-2 py-0.5">
        <Price :value="item.total" />
        <NumTrades :num="item.num" />
      </td>
      <td
        v-for="symbol in usedSymbols"
        :key="symbol"
        class="px-2 py-0.5 whitespace-nowrap"
      >
        <template v-if="item.symbols[symbol]">
          <Price :value="item.symbols[symbol].all" />
          <NumTrades :num="item.symbols[symbol].num" />
        </template>
        <template v-else> - </template>
      </td>
    </template>
  </Table>
</template>
