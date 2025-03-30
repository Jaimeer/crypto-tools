<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { init, dispose, registerOverlay } from "klinecharts";
import { vElementSize } from "@vueuse/components";
import { KLine, Periods, Position, Trade } from "../../server/Bingx.service";
import { addMonths, subHours } from "date-fns";
import { simpleAnnotationDown } from "./klinechart/simpleAnnotationDown.overlay";
import { rectangle } from "./klinechart/rectangle.overlay";

registerOverlay(rectangle);
registerOverlay(simpleAnnotationDown);

const chart = ref();

const props = defineProps<{
  symbol: string;
  periods: Periods;
  hideTrades: boolean;
  klines: KLine[];
  trades: Trade[];
  positions: Position[];
}>();

const printData = (start: boolean) => {
  if (chart.value) {
    const priceSample = parseFloat(props.klines[0]?.close);
    const decimals =
      priceSample > 1000 ? 0 : priceSample > 10 ? 2 : priceSample > 0 ? 4 : 6;

    const data =
      props.klines.toReversed().map((item) => ({
        close: parseFloat(item.close),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        open: parseFloat(item.open),
        timestamp: item.time,
        volume: parseFloat(item.volume),
      })) ?? [];
    if (start) {
      chart.value.setPrecision({ price: decimals });
      chart.value.applyNewData(data);
    } else {
      const latestPoint = data[data.length - 1];
      const currentData = chart.value.getDataList();
      const lastChartTimestamp =
        currentData.length > 0
          ? currentData[currentData.length - 1].timestamp
          : 0;

      if (latestPoint.timestamp !== lastChartTimestamp) {
        const latestPoint2 = data[data.length - 2];
        chart.value.updateData(latestPoint2); // Update the previous last candle with the last info
        chart.value.updateData(latestPoint);
      } else {
        chart.value.updateData(latestPoint);
      }
    }
    draw();
  }
};
const filteredTrades = computed(() => {
  const minDate = Math.min(
    props.klines[0]?.time,
    props.klines[props.klines.length - 1]?.time,
  );
  return props.trades.filter(
    (x) =>
      new Date(x.filledTime).getTime() >
      subHours(new Date(minDate), 1).getTime(),
  );
});

const draw = () => {
  chart.value.removeOverlay({ groupId: "trades" });
  chart.value.removeOverlay({ groupId: "positions" });

  // Buys & Sells
  if (!props.hideTrades) {
    filteredTrades.value.forEach((trade) => {
      const tradeTime = new Date(trade.filledTime).getTime();
      const tradePrice = parseFloat(trade.price);

      const color = trade.side === "BUY" ? "#20aa93" : "#FF0000";
      const overlayName =
        trade.side === "BUY" ? "simpleAnnotationDown" : "simpleAnnotation";
      chart.value.createOverlay({
        name: overlayName,
        groupId: "trades",
        points: [{ timestamp: tradeTime, value: tradePrice }],
        lock: true,
        extendData: trade.side.charAt(0),
        styles: {
          text: {
            color: "#FFFFFF",
            backgroundColor: color,
          },
          polygon: { color },
          line: { color },
        },
      });
    });
  }

  const color = (opacity: number, isLong: boolean) =>
    isLong ? `#6666ff${opacity}` : `#ff33cc${opacity}`;

  // Positions
  props.positions.forEach((position) => {
    // Current LONG/SHORT price
    const positionPrice = parseFloat(position.avgPrice);
    const isLong = position.positionSide === "LONG";
    const lineColor = color(90, isLong);
    const fillColor = color(20, isLong);

    chart.value.createOverlay({
      name: "priceLine",
      groupId: "positions",
      points: [{ value: positionPrice }],
      lock: true,
      styles: {
        text: {
          color: "#FFFFFF",
          backgroundColor: lineColor,
        },
        polygon: { color: lineColor },
        line: { color: lineColor },
      },
    });
    // Exit price at 1%
    const percentage = 1;
    const exitPrice =
      positionPrice + ((isLong ? 1 : -1) * positionPrice * percentage) / 100;
    chart.value.createOverlay({
      name: "priceLine",
      groupId: "positions",
      points: [{ value: exitPrice }],
      lock: true,
      styles: {
        text: {
          color: "#FFFFFF",
          backgroundColor: lineColor,
        },
        polygon: { color: lineColor },
        line: { color: lineColor },
      },
    });
    // Fill rectangle
    const startTime = 0;
    const endTime = addMonths(new Date(), 1).getTime();
    chart.value.createOverlay({
      name: "rectangle",
      groupId: "positions",
      points: [
        { timestamp: startTime, value: positionPrice },
        { timestamp: endTime, value: exitPrice },
      ],
      lock: true,
      styles: {
        rect: {
          style: "fill",
          borderColor: fillColor,
          borderSize: 0,
          color: fillColor,
        },
      },
    });
  });
};

onMounted(async () => {
  chart.value = init(`chart-${props.symbol}`, {
    styles: {
      grid: {
        horizontal: {
          color: "#444",
        },
        vertical: {
          color: "#444",
        },
      },
    },
  });

  printData(true);
});

const updateChartSize = () => {
  // const chartContainer = document.getElementById(`chart-${props.symbol}`)
  if (chart.value) {
    chart.value.resize(chart.value.clientWidth, chart.value.clientHeight);
  }
};

onUnmounted(() => {
  dispose(`chart-${props.symbol}`);
});

watch(
  () => props.klines[0].close,
  () => {
    printData(false);
  },
);

watch(
  () => props.hideTrades,
  () => {
    draw();
  },
);
</script>

<template>
  <div class="relative" v-element-size="updateChartSize">
    <!-- {{ trades.length }} - {{ filteredTrades.length }} -->
    <div class="absolute bottom-10 text-xl font-bold text-slate-700 uppercase">
      {{ symbol }} - {{ periods }}
    </div>
    <div :id="`chart-${symbol}`" class="h-[370px] w-full" />
    <!-- {{ trades }} -->
    <!-- <pre>{{ positions }}</pre> -->
  </div>
</template>
