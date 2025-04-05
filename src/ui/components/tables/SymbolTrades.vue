<script setup lang="ts">
import { computed, ref } from "vue";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import Table from "../Table.vue";
import Price from "../Price.vue";
import { usePreferencesStore } from "../../store/preferences.store";
import { useBingXTradesStore } from "../../store/bingxTrades.store";
import { useBitkuaBotsStore } from "../../store/bitkuaBots.store";
import { BitkuaActionUpdateStatus } from "../../../server/Bitkua.dto";
import { useBingXPositionsStore } from "../../../ui/store/bingxPositions.store";

const bingXTradesStore = useBingXTradesStore();
const bingXTransactionsStore = useBingXTransactionsStore();
const bingXPositionsStore = useBingXPositionsStore();
const bitkuaBotsStore = useBitkuaBotsStore();
const preferencesStore = usePreferencesStore();

const transactions = computed(() => {
  return bingXTransactionsStore.transactions.filter((x) => x.symbol);
});

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
  num: number;
  pnl: number;
  all: number;
  charges: number;
  volume: number;
  long: TradesInfoSide;
  short: TradesInfoSide;
};

const tradesInfo = computed(() => {
  let closeLongDetected: Record<string, boolean> = {};
  let closeShortDetected: Record<string, boolean> = {};

  const data = transactions.value.reduce(
    (acc, transaction) => {
      if (!usedSymbols.value.includes(transaction.symbol)) {
        return acc;
      }
      const symbol = transaction.symbol;
      if (!acc[transaction.symbol]) {
        acc[symbol] = {
          num: 0,
          pnl: 0,
          all: 0,
          charges: 0,
          volume: 0,
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
      if (transaction.incomeType === "REALIZED_PNL") {
        acc[transaction.symbol].num++;
        acc[transaction.symbol].pnl += parseFloat(transaction.income);
      } else {
        acc[transaction.symbol].charges += parseFloat(transaction.income);
      }
      acc[transaction.symbol].all += parseFloat(transaction.income);
      return acc;
    },
    {} as Record<string, TradesInfo>,
  );

  trades.value.reduce((acc, trade) => {
    if (!usedSymbols.value.includes(trade.symbol)) {
      return acc;
    }
    const symbol = trade.symbol;
    if (!acc[symbol]) {
      acc[symbol] = {
        num: 0,
        pnl: 0,
        all: 0,
        charges: 0,
        volume: 0,
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
  }, data);

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
      lamilagrosa: "HFT Long La Mialagrosa F-15",
      shortlamilagrosa: "HFT Short La Mialagrosa F-15",
    }[strategy] ?? strategy
  );
};

const strategyNameShort = (strategy: string) => {
  if (!strategy) return "---";
  return (
    {
      ladominantkongbingxactive: "DOM",
      shortladominantkongbingxactive: "DOM",
      shortalashitcoinbingxactive: "LSH",
      longalashitcoinbingxactive: "LSH",
      liquiditypoolbingxactive: "LLP",
      shortliquiditypoolbingxactive: "LLP",
      aiexpertavgbingxactive: "AIE",
      shortaiexpertavgbingxactive: "AIE",
      lamilagrosa: "LMG",
      shortlamilagrosa: "LMG",
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
    :headers="[
      'symbol',
      'num_RPNL',
      'RPNL',
      'charges',
      'profit',
      'Long',
      'U_PNL',
      'DK Bot (Long)',
      'Short',
      'U_PNL',
      'DK Bot (Short)',
    ]"
    :items="tradesInfo"
  >
    <template #default="{ item }">
      <td class="px-2 py-0.5">{{ item.key.replace("-USDT", "") }}</td>
      <td class="px-2 py-0.5">{{ item.num }}</td>
      <td class="px-2 py-0.5"><Price :value="item.pnl" :decimals="2" /></td>
      <td class="px-2 py-0.5"><Price :value="item.charges" :decimals="2" /></td>
      <td class="px-2 py-0.5"><Price :value="item.all" :decimals="2" /></td>
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
        <td class="px-2 py-0.5">
          <div class="flex gap-1">
            <Price
              :value="
                parseFloat(
                  bingXPositionsStore.positions.filter((position) => {
                    return (
                      position.symbol === item.key &&
                      position.positionSide === side.toUpperCase()
                    );
                  })[0]?.unrealizedProfit,
                )
              "
              :decimals="2"
            />

            <Price
              :value="
                100 *
                parseFloat(
                  bingXPositionsStore.positions.filter((position) => {
                    return (
                      position.symbol === item.key &&
                      position.positionSide === side.toUpperCase()
                    );
                  })[0]?.pnlRatio ?? '0',
                )
              "
              :decimals="2"
              suffix="%"
            />
          </div>
        </td>
        <td class="flex items-center gap-1">
          <span class="text-slate-600">{{ item[side].botId }}</span>
          <span
            :class="{
              'text-slate-400': item[side].status === 'active',
              'text-slate-600 line-through': item[side].status === 'stop',
              'text-amber-600': item[side].status === 'onlysell',
            }"
            v-tooltip="strategyName(item[side].strategy)"
            >{{ strategyNameShort(item[side].strategy) }}</span
          >
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
</template>
