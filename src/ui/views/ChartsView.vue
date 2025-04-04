<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useBingXTransactionsStore } from "../store/bingxTransactions.store";
import KLineChart from "../components/KLineChart.vue";
import TheHeader from "../components/TheHeader.vue";
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

const selectedPeriod = ref<Period>("15m");

const search = ref("");

const isRefreshing = ref(false);

const fetchData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await Promise.all(
      bingXTransactionsStore.allSymbols.map((symbol) =>
        bingXKLinesStore.fetchKLines(symbol, selectedPeriod.value),
      ),
    );
  } finally {
    isRefreshing.value = false;
  }
};

const filteredFilters = computed(() => {
  if (!search.value)
    return usedSymbols.value.sort((a, b) => a.localeCompare(b));
  return bingXTransactionsStore.allSymbols
    .filter((symbol) =>
      symbol.toLowerCase().includes(search.value.toLowerCase()),
    )
    .sort((a, b) => a.localeCompare(b));
});

const usedSymbols = computed(() => {
  return bingXTransactionsStore.allSymbols
    .filter((x) => !preferencesStore.hidedSymbols.includes(x))
    .sort();
});

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <div class="p-4">
    <TheHeader>
      <template #left>
        <input
          type="text"
          v-model="search"
          placeholder="Search..."
          class="rounded border border-gray-600 px-2 py-1 focus:border-blue-500 focus:outline-none"
        />
      </template>
      <template #right>
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
          @click="preferencesStore.hideTrades = !preferencesStore.hideTrades"
          class="rounded px-4 py-1 text-white transition hover:bg-emerald-600"
          :class="{
            'bg-emerald-400': preferencesStore.hideTrades,
            'bg-emerald-600': !preferencesStore.hideTrades,
          }"
        >
          <span
            >{{ preferencesStore.hideTrades ? "Hided" : "Hide" }} trades
          </span>
        </button>
      </template>
    </TheHeader>
    <div
      class="3xl:grid-cols-4 4xl:grid-cols-5 grid grid-cols-1 gap-2 xl:grid-cols-2 2xl:grid-cols-3"
    >
      <div
        v-for="symbol in filteredFilters"
        class="relative h-96 w-full"
        :key="`${selectedPeriod}-${symbol}`"
      >
        <div
          v-if="!bingXKLinesStore.kLine(symbol, selectedPeriod)?.length"
          class="flex h-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
        >
          {{ symbol }} Fetching data...
        </div>
        <KLineChart
          v-else
          :symbol="symbol"
          :period="selectedPeriod"
          :hideTrades="preferencesStore.hideTrades"
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
