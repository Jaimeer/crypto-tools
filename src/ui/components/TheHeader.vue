<script setup lang="ts">
import { ref, watch } from "vue";
import { useBingXTransactionsStore } from "../store/bingxTransactions.store";
import { useBingXConfigStore } from "../store/bingxConfig.store";
import { usePreferencesStore } from "../store/preferences.store";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { RouterLink, useRouter } from "vue-router";

const bingXConfig = useBingXConfigStore();
const bingXTransactionsStore = useBingXTransactionsStore();
const preferencesStore = usePreferencesStore();
const router = useRouter();

const selectedSymbols = ref(preferencesStore.hidedSymbols);

const cleanHidedSymbols = () => {
  selectedSymbols.value = [];
};

const openChartsWindow = () => {
  window.electronAPI.openChartsWindow();
  router.push("/");
};

watch(selectedSymbols, () => {
  preferencesStore.hidedSymbols = selectedSymbols.value;
});
</script>

<template>
  <div class="mb-4 flex items-center justify-between">
    <div class="flex gap-2" flex items-center>
      <h1 class="text-xl font-bold">BingX Transactions</h1>
      <RouterLink
        to="/"
        class="rounded bg-slate-500 px-4 py-1 text-white transition hover:bg-slate-600"
      >
        Dashboard
      </RouterLink>
      <RouterLink
        to="/charts"
        class="rounded bg-slate-500 px-4 py-1 text-white transition hover:bg-slate-600"
      >
        Charts
      </RouterLink>
      <button
        class="cursor-pointer rounded bg-blue-400 px-4 py-1 text-white transition hover:bg-blue-600"
        @click="openChartsWindow"
      >
        New Window
      </button>
      <slot name="left" />
    </div>
    <div class="flex items-center gap-2">
      <slot name="right" />
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
              v-for="symbol in bingXTransactionsStore.allSymbols.sort()"
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
      <button
        @click="bingXConfig.toggleViewConfig"
        class="rounded bg-amber-500 px-4 py-1 text-white transition hover:bg-amber-600"
      >
        <span>Config</span>
      </button>
    </div>
  </div>
</template>
