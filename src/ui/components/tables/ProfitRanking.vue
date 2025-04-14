<script setup lang="ts">
import { computed, ref } from "vue";
import { subDays, subHours, subWeeks } from "date-fns";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import Table from "../Table.vue";
import Price from "../Price.vue";
import Symbol from "../Symbol.vue";
import { usePreferencesStore } from "../../../ui/store/preferences.store";

const bingXTransactionsStore = useBingXTransactionsStore();
const preferencesStore = usePreferencesStore();

type RankingData = {
  profit4h: number;
  profit24h: number;
  profit1w: number;
};

const transactions = computed(() => {
  return bingXTransactionsStore.transactions.filter(
    (x) => x.symbol && !preferencesStore.hidedSymbols.includes(x.symbol),
  );
});

const sortBy = ref<"4h" | "24h" | "1w">("4h");

const symbolRanking = computed(() => {
  const now = new Date();
  const date4h = subHours(now, 4).getTime();
  const date24h = subDays(now, 1).getTime();
  const date1w = subWeeks(now, 1).getTime();
  const data = transactions.value.reduce(
    (acc, transaction) => {
      const symbol = transaction.symbol.replace("-USDT", "");

      if (!acc[symbol]) {
        acc[symbol] = { profit4h: 0, profit24h: 0, profit1w: 0 };
      }

      if (transaction.time > date1w)
        acc[symbol].profit1w += parseFloat(transaction.income);

      if (transaction.time > date24h)
        acc[symbol].profit24h += parseFloat(transaction.income);

      if (transaction.time > date4h)
        acc[symbol].profit4h += parseFloat(transaction.income);

      return acc;
    },
    {} as Record<string, RankingData>,
  );

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => {
      if (sortBy.value === "4h") return b.profit4h - a.profit4h;
      if (sortBy.value === "24h") return b.profit24h - a.profit24h;
      if (sortBy.value === "1w") return b.profit1w - a.profit1w;
      return 0;
    });
});
</script>

<template>
  <Table :headers="[]" :items="symbolRanking">
    <template #headers>
      <th class="px-2 py-0.5">Symbol</th>
      <th
        class="px-2 py-0.5"
        :class="{ 'cursor-pointer font-light': sortBy !== '4h' }"
        @click="sortBy = '4h'"
      >
        <span @click="sortBy = '4h'">P_4H</span>
      </th>
      <th
        class="px-2 py-0.5"
        :class="{ 'cursor-pointer font-light': sortBy !== '24h' }"
        @click="sortBy = '24h'"
      >
        <span @click="sortBy = '24h'">P_24H</span>
      </th>
      <th
        class="px-2 py-0.5"
        :class="{ 'cursor-pointer font-light': sortBy !== '1w' }"
        @click="sortBy = '1w'"
      >
        <span @click="sortBy = '1w'">P_1W</span>
      </th>
    </template>
    <template #default="{ item }">
      <td class="px-2 py-0.5">
        <Symbol :value="item.key" />
      </td>
      <td class="px-2 py-0.5">
        <Price :value="item.profit4h" :decimals="2" />
      </td>
      <td class="px-2 py-0.5">
        <Price :value="item.profit24h" :decimals="2" />
      </td>
      <td class="px-2 py-0.5">
        <Price :value="item.profit1w" :decimals="2" />
      </td>
    </template>
  </Table>
</template>
