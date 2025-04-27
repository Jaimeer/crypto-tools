<script setup lang="ts">
import { computed } from "vue";
import Price from "./Price.vue";
import { useBingXPositionsStore } from "../store/bingx/bingxPositions.store";

import { useElementHover } from "@vueuse/core";
import { useTemplateRef } from "vue";

const props = defineProps<{
  symbol: string;
  side: "long" | "short";
  allVisible: boolean;
}>();

const bingxPositionsStore = useBingXPositionsStore();

const myHoverableElement = useTemplateRef<HTMLButtonElement>("rescueElement");
const isHovered = useElementHover(myHoverableElement);

const position = computed(() => {
  return bingxPositionsStore.positions.find(
    (position) =>
      position.symbol.replace("-USDT", "") ===
        props.symbol.replace("-USDT", "") &&
      position.positionSide === props.side.toUpperCase(),
  );
});

const investToToGap = (desiredGap: number) => {
  if (!position.value) return 0;
  const markPrice = parseFloat(position.value.markPrice);
  const avgOpenPrice = parseFloat(position.value.avgPrice);
  const positionValue = parseFloat(position.value.positionValue);
  const leverage = parseFloat(position.value.leverage);

  const offset = (avgOpenPrice - markPrice) * (desiredGap / 100);
  const newAvgOpenPrice = markPrice + offset;

  const currentTokens = positionValue / markPrice;
  const q =
    (currentTokens * (avgOpenPrice - newAvgOpenPrice)) /
    (newAvgOpenPrice / markPrice - 1);
  return q / leverage;
};

const gaps = [
  { value: 5, visible: false },
  { value: 10, visible: true },
  { value: 50, visible: false },
];
</script>

<template>
  <div class="flex gap-1 text-xs" ref="rescueElement">
    <template v-for="gap in gaps" :key="gap.value">
      <div v-if="investToToGap(gap.value) > 0 && (allVisible || gap.visible)">
        {{ gap.value }}%[
        <Price
          :value="investToToGap(gap.value)"
          :decimals="2"
          color="orange"
        />]
      </div>
    </template>
  </div>
</template>
