<script setup lang="ts">
import { computed, ref } from "vue";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import Table from "../Table.vue";
import { usePreferencesStore } from "../../store/preferences.store";
import { useBingXTradesStore } from "../../store/bingxTrades.store";
import { useBitkuaBotsStore } from "../../store/bitkuaBots.store";
import { BitkuaActionUpdateStatus } from "../../../server/Bitkua.dto";

const bingXTradesStore = useBingXTradesStore();
const bingXTransactionsStore = useBingXTransactionsStore();
const bitkuaBotsStore = useBitkuaBotsStore();
const preferencesStore = usePreferencesStore();

const trades = computed(() => {
  return bingXTradesStore.trades;
});

type TradesInfoSide = {
  open: number;
  close: number;
  currentOpen: number;
  amount: number;
  botId: string;
  strategy: string;
  status: string;
  orders: number;
};
type TradesInfo = {
  long: TradesInfoSide;
  short: TradesInfoSide;
};

const tradesInfo = computed(() => {
  let closeLongDetected: Record<string, boolean> = {};
  let closeShortDetected: Record<string, boolean> = {};
  const data: Record<string, TradesInfo> = trades.value.reduce(
    (acc, trade) => {
      if (!usedSymbols.value.includes(trade.symbol)) {
        return acc;
      }
      const symbol = trade.symbol;
      if (!acc[symbol]) {
        acc[symbol] = {
          long: {
            open: 0,
            close: 0,
            currentOpen: 0,
            amount: 0,
            botId: "",
            strategy: "",
            status: "",
            orders: 0,
          },
          short: {
            open: 0,
            close: 0,
            currentOpen: 0,
            amount: 0,
            botId: "",
            strategy: "",
            status: "",
            orders: 0,
          },
        };
      }
      if (trade.positionSide === "LONG") {
        if (!closeLongDetected[symbol] && parseFloat(trade.realisedPNL) !== 0)
          closeLongDetected[symbol] = true;
        if (!closeLongDetected[symbol]) acc[symbol].long.currentOpen++;

        if (parseFloat(trade.realisedPNL) === 0) acc[symbol].long.open++;
        else acc[symbol].long.close++;

        const bot = bitkuaBotsStore.bots.find(
          (x) =>
            x.symbol.toLowerCase() === symbol.toLowerCase().replace("-", "") &&
            !x.strategy.includes("short"),
        );
        acc[symbol].long.amount = parseInt(bot?.amount || "0");
        acc[symbol].long.botId = bot?.id || "";
        acc[symbol].long.strategy = bot?.strategy || "";
        acc[symbol].long.status = bot?.status || "";
        acc[symbol].long.orders = parseInt(bot?.orders || "0");
      } else {
        if (!closeShortDetected[symbol] && parseFloat(trade.realisedPNL) !== 0)
          closeShortDetected[symbol] = true;
        if (!closeShortDetected[symbol]) acc[symbol].short.currentOpen++;

        if (parseFloat(trade.realisedPNL) === 0) acc[symbol].short.open++;
        else acc[symbol].short.close++;

        const bot = bitkuaBotsStore.bots.find(
          (x) =>
            x.symbol.toLowerCase() === symbol.toLowerCase().replace("-", "") &&
            x.strategy.includes("short"),
        );
        acc[symbol].short.amount = parseInt(bot?.amount || "0");
        acc[symbol].short.botId = bot?.id || "";
        acc[symbol].short.strategy = bot?.strategy || "";
        acc[symbol].short.status = bot?.status || "";
        acc[symbol].short.orders = parseInt(bot?.orders || "0");
      }
      return acc;
    },
    {} as Record<string, TradesInfo>,
  );

  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort(
      (a, b) =>
        Math.max(b.long.currentOpen, b.short.currentOpen) -
        Math.max(a.long.currentOpen, a.short.currentOpen),
    );
});

const usedSymbols = computed(() => {
  return bingXTransactionsStore.allSymbols
    .filter((x) => !preferencesStore.hidedSymbols.includes(x))
    .sort();
});

const strategyName = (strategy: string) => {
  if (!strategy) return "---";
  return (
    {
      ladominantkongbingxactive: "HFT Long Dominant Kong Infinity F-∞",
      shortladominantkongbingxactive: "HFT Short Dominant Kong F-12",
      shortalashitcoinbingxactive: "HFT Short A La Shitcoin F-12",
      longalashitcoinbingxactive: "HFT Long A La Shitcoin F-13",
      liquiditypoolbingxactive: "HFT Long Liquidity Pool F-120",
      shortliquiditypoolbingxactive: "HFT Short Liquidity Pool F-120",
      aiexpertavgbingxactive: "HFT Long AI Expert F-14",
      shortaiexpertavgbingxactive: "HFT Short AI Expert F-12",
    }[strategy] ?? strategy
  );
};

const sides = ["long", "short"] as const;
const status = ["active", "stop", "onlysell"] as const;

const sendAction = (
  botId: string,
  status: "active" | "stop" | "onlysell",
  amount?: number,
) => {
  const message: BitkuaActionUpdateStatus = {
    action: "updateStatus",
    botId,
    status,
  };
  window.electronAPI.sendBitkuaAction(message);
};
</script>

<template>
  <Table
    :headers="['symbol', 'Long', 'DK Bot (Long)', 'Short', 'DK Bot (Short)']"
    :items="tradesInfo"
    class="col-span-3"
  >
    <template #default="{ item }">
      <td class="px-2 py-0.5">{{ item.key.replace("-USDT", "") }}</td>
      <template v-for="side in sides" :key="side">
        <td class="px-2 py-0.5">
          <div class="flex gap-0.5">
            <span class="text-amber-400">{{ item[side].open }}</span>
            <span class="text-slate-600">/</span>
            <span class="text-lime-400">{{ item[side].close }}</span>
            <span class="text-slate-600">/</span>
            <span
              :class="{
                'text-slate-400': item[side].currentOpen === 0,
                'text-violet-400':
                  item[side].currentOpen > 0 && item[side].currentOpen < 13,
                'text-rose-400': item[side].currentOpen >= 13,
              }"
              >{{ item[side].currentOpen }}
            </span>
          </div>
        </td>
        <td class="flex items-center gap-1">
          <span class="text-slate-600">{{ item[side].botId }}</span>
          <span>{{ strategyName(item[side].strategy) }}</span>
          <span class="text-blue-400">[{{ item[side].amount }}]</span>
          <span
            :class="{
              'text-slate-400': item[side].orders === 0,
              'text-lime-400': item[side].orders > 0 && item[side].orders < 14,
              'text-red-400': item[side].orders >= 13,
            }"
          >
            [{{ item[side].orders }}]
          </span>
          <button
            v-for="status in status"
            class="cursor-pointer rounded px-1 text-xs transition disabled:cursor-default"
            :class="{
              'text-green-600 hover:text-green-400 disabled:bg-green-900 disabled:text-green-200':
                status === 'active',
              'text-red-600 hover:text-red-400 disabled:bg-red-900 disabled:text-red-200':
                status === 'stop',
              'text-amber-600 hover:text-amber-400 disabled:bg-amber-900 disabled:text-amber-200':
                status === 'onlysell',
            }"
            :disabled="item[side].status === status"
            @click="sendAction(item[side].botId, status)"
          >
            {{ status }}
          </button>
        </td>
      </template>
    </template>
  </Table>
  <div></div>
</template>
