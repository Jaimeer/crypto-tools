<script setup lang="ts">
import { computed, ref } from "vue";
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";
import KLineChart from "../components/KLineChart.vue";
import { useBingXKLinesStore } from "../store/bingxKLines.store";
import { useBingXPositionsStore } from "../store/bingxPositions.store";
import { useBingXTradesStore } from "../store/bingxTrades.store";
import { useBingXContractsStore } from "../store/bingxContracts.store";

const props = defineProps<{ value: string }>();

const symbol = computed(() => {
  if (props.value.includes("USDT")) return props.value;
  return props.value + "-USDT";
});

const bingXTradesStore = useBingXTradesStore();
const bingXPositionsStore = useBingXPositionsStore();
const bingXKLinesStore = useBingXKLinesStore();
const bingXContractsStore = useBingXContractsStore();

const isOpen = ref(false);

function closeModal() {
  isOpen.value = false;
}
function openModal() {
  isOpen.value = true;
  bingXKLinesStore.fetchKLines(symbol.value, "15m");
}
const contract = computed(() => {
  return bingXContractsStore.contracts.find((x) => x.symbol === symbol.value);
});
</script>

<template>
  <div class="flex items-center gap-1">
    <div class="cursor-pointer underline decoration-dotted" @click="openModal">
      {{ value }}
    </div>

    <span v-if="!contract" class="text-red-400"> no contract </span>
    <template v-else>
      <span v-if="contract?.apiStateOpen === 'false'" class="text-red-400">
        open
      </span>
      <span v-if="contract?.apiStateClose === 'false'" class="text-red-400">
        close
      </span>
    </template>
  </div>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-7xl transform overflow-hidden rounded-md border border-slate-600 bg-slate-900 p-4 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle as="h3" class="flex items-center justify-between">
                <div class="text-lg font-medium text-slate-400">
                  {{ symbol }}
                </div>

                <button
                  class="cursor-pointer rounded border-0 bg-blue-400 px-4 py-1 text-xs text-white transition hover:bg-blue-600 focus:outline-none"
                  @click="closeModal"
                >
                  Close
                </button>
              </DialogTitle>
              <div class="mt-2">
                <div
                  v-if="!bingXKLinesStore.kLine(symbol, '15m')?.length"
                  class="flex h-full items-center justify-center rounded border border-gray-600 p-4 text-slate-600"
                >
                  {{ symbol }} Fetching data...
                </div>
                <KLineChart
                  v-else
                  :symbol="symbol"
                  period="15m"
                  :hideTrades="false"
                  :klines="bingXKLinesStore.kLine(symbol, '15m') ?? []"
                  :trades="
                    bingXTradesStore.trades.filter((x) => x.symbol === symbol)
                  "
                  :positions="
                    bingXPositionsStore.positions.filter(
                      (x) => x.symbol === symbol,
                    )
                  "
                  size="large"
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
