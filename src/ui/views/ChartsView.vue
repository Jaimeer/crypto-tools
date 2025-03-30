<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useBingXTransactionsStore } from "../store/bingxTransactions.store";
import KLineChart from "../components/KLineChart.vue";
import { useBingXTradesStore } from "../store/bingxTrades.store";
import { useBingXPositionsStore } from "../store/bingxPositions.store";
import { usePreferencesStore } from "../store/preferences.store";
import { useBingXKLinesStore } from "../store/bingxKLines.store";
import { Period } from "../../server/BingX.dto";

const bingXTransactionsStore = useBingXTransactionsStore();
const bingXTradesStore = useBingXTradesStore();
const bingXPositionsStore = useBingXPositionsStore();
const preferencesStore = usePreferencesStore();
const bingXKLinesStore = useBingXKLinesStore();

const isRefreshing = ref(false);

const fetchData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    // await bingXTradesStore.fetchTrades();
    // await bingXPositionsStore.fetchPositions();

    await Promise.all(
      bingXTransactionsStore.allSymbols
        // .filter((x) => x === "FORM-USDT")
        .map((symbol) =>
          bingXKLinesStore.fetchKLines(symbol, selectedPeriod.value),
        ),
    );
  } finally {
    isRefreshing.value = false;
  }
};

const periodsOptions: Period[] = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
];

const selectedPeriod = ref<Period>("1m");
const hideTrades = ref(preferencesStore.hideTrades);

const search = ref("");

const filteredFilters = computed(() => {
  if (!search.value)
    return bingXTransactionsStore.allSymbols.sort((a, b) => a.localeCompare(b));
  return bingXTransactionsStore.allSymbols
    .filter((symbol) =>
      symbol.toLowerCase().includes(search.value.toLowerCase()),
    )
    .sort((a, b) => a.localeCompare(b));
});

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-2">
        <h1 class="text-xl font-bold">BingX Transactions</h1>
        <RouterLink
          to="/"
          class="focus:ring-opacity-50 rounded bg-slate-500 px-4 py-1 text-white transition hover:bg-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          Dashboard
        </RouterLink>
        <input
          type="text"
          v-model="search"
          placeholder="Search..."
          class="rounded border border-gray-600 px-2 py-1 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <div class="flex items-center gap-3">
          Hide trade
          <input type="checkbox" v-model="hideTrades" />
          Period
          <button
            v-for="option in periodsOptions"
            @click="selectedPeriod = option"
            :key="option"
            :class="{
              'text-slate-200': selectedPeriod === option,
              'text-slate-600': selectedPeriod !== option,
            }"
          >
            {{ option }}
          </button>
          <button
            @click="fetchData"
            class="focus:ring-opacity-50 rounded bg-blue-500 px-4 py-1 text-white transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :disabled="isRefreshing || bingXTransactionsStore.loading"
          >
            <span v-if="isRefreshing || bingXTransactionsStore.loading"
              >Refreshing...</span
            >
            <span v-else>Refresh</span>
          </button>
        </div>
      </div>
    </div>
    <div
      class="3xl:grid-cols-4 grid grid-cols-1 gap-2 xl:grid-cols-2 2xl:grid-cols-3"
    >
      <div
        v-for="symbol in filteredFilters"
        class="relative h-96 w-full rounded border border-gray-600 p-4"
        :key="`${selectedPeriod}-${symbol}`"
      >
        <div
          v-if="!bingXKLinesStore.kLine(symbol, selectedPeriod)?.length"
          class="flex h-full items-center justify-center text-slate-600"
        >
          {{ symbol }} Fetching data...
        </div>
        <KLineChart
          v-else
          :symbol="symbol"
          :periods="selectedPeriod"
          :hideTrades="hideTrades"
          :klines="bingXKLinesStore.kLine(symbol, selectedPeriod) ?? []"
          :trades="bingXTradesStore.trades.filter((x) => x.symbol === symbol)"
          :positions="
            bingXPositionsStore.positions.filter((x) => x.symbol === symbol)
          "
        />
      </div>
    </div>
  </div>
</template>
