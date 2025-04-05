import { createApp } from "vue";
import { createPinia } from "pinia";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";

import App from "./App.vue";
import { router } from "./router";
import { NotifyMessage } from "./server/BingX.dto";
import { useBingXTransactionsStore } from "./ui/store/bingxTransactions.store";
import { useBingXTradesStore } from "./ui/store/bingxTrades.store";
import { useBingXBalanceStore } from "./ui/store/bingxBalance.store";
import { useBingXPositionsStore } from "./ui/store/bingxPositions.store";
import { useBingXKLinesStore } from "./ui/store/bingxKLines.store";
import { useBitkuaBotsStore } from "./ui/store/bitkuaBots.store";

const pinia = createPinia();

const app = createApp(App);
app.use(router);
app.use(pinia);
app.use(FloatingVue);
app.mount("#app");

const transactionsStore = useBingXTransactionsStore();
const tradesStore = useBingXTradesStore();
const balanceStore = useBingXBalanceStore();
const positionsStore = useBingXPositionsStore();
const klineStore = useBingXKLinesStore();
const botsStore = useBitkuaBotsStore();

const updateDataHandler = (message: NotifyMessage) => {
  switch (message.store) {
    case "transactions":
      transactionsStore.processMessage(message.transactions);
      break;
    case "trades":
      //   console.log("trades", message.trades);
      tradesStore.processMessage(message.trades);
      break;
    case "balance":
      balanceStore.processMessage(message.balance);
      break;
    case "positions":
      positionsStore.processMessage(message.positions);
      break;
    case "klines":
      klineStore.processMessage(message.symbol, message.period, message.klines);
      break;
    case "bots":
      botsStore.processMessage(message.bots);
      break;
    default:
      console.log(message);
      break;
  }
};

window.electronAPI.onUpdateData(updateDataHandler);
