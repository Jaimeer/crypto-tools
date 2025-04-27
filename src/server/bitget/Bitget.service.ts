import { BrowserWindow } from "electron";
import { NotifyMessage } from "../messages.dto";
import {
  Balance,
  Contract,
  KLine,
  Position,
  Trade,
  Transaction,
} from "../data.dto";
import { BitgetRestClient } from "./BitgetRest.client";
import { FuturesAccountsV2, FuturesTransactionRecordV2 } from "bitget-api";
// import {
//   Balance,
//   Contract,
//   KLine,
//   NotifyMessage,
//   Period,
//   Position,
//   Trade,
//   Transaction,
// } from "./Bitget.dto";
// import { v4 as uuidv4 } from "uuid";
// import { BitgetRestClient } from "./BingxRest.client";
// import { BitgetWebSocket } from "./BingxWebSocket.client";
// import { KLineDataEvent, WebSocketMessage } from "./Bitget.ws.dto";
// import { CacheService } from "./Cache.service";

// const klineRegex = /^([A-Z0-9]*-[A-Z0-9]*)?@kline_([1-9]*[mhdwM]*)?$/;

export class BitgetService {
  private readonly restClient: BitgetRestClient;
  // private readonly wsClient: BitgetWebSocket;
  // private readonly cacheService: CacheService;
  // private refreshInterval: NodeJS.Timeout | null = null;
  private data: {
    transactions: Transaction[];
    trades: Trade[];
    kLines: Record<
      string,
      {
        socketId: string;
        data: KLine[];
      }
    >;
    balance: Balance | undefined;
    positions: Position[];
    contracts: Contract[];
  } = {
    transactions: [],
    trades: [],
    kLines: {},
    balance: undefined,
    positions: [],
    contracts: [],
  };

  constructor(apiKey: string, apiSecret: string, password: string) {
    console.log("[Bitget] BitgetService constructor ");
    if (!this.restClient) {
      this.restClient = new BitgetRestClient(apiKey, apiSecret, password);
    }
    // if (!this.wsClient)
    //   this.wsClient = new BitgetWebSocket(
    //     this.restClient,
    //     this.handleWebSocketMessage.bind(this),
    //   );
    // this.cacheService = new CacheService();
    // if (apiKey && apiSecret) {
    //   this.cacheService.setHashCode(this.restClient.hashCode);
    // }
  }

  setCredentials(apiKey: string, apiSecret: string, password: string) {
    console.log("[Bitget]", { apiKey, apiSecret, password });
    // this.restClient.setCredentials(apiKey, apiSecret);
    // this.wsClient.updateListenKey();
    // this.cacheService.setHashCode(this.restClient.hashCode);
  }

  startAutoRefresh(intervalMs = 60000) {
    // this.stopAutoRefresh();
    this.loadData();
    // this.refreshInterval = setInterval(async () => {
    //   try {
    //     await this.loadData();
    //   } catch (error) {
    //     console.error("BingxService auto-refresh failed:", error);
    //   }
    // }, intervalMs);
    // console.log(
    //   `BingxService auto-refresh started: every ${intervalMs / 1000} seconds`,
    // );
  }

  stopWebSocket() {
    // this.wsClient.stop();
  }
  stopAutoRefresh() {
    // this.stopWebSocket();
    // if (this.refreshInterval) {
    //   clearInterval(this.refreshInterval);
    //   this.refreshInterval = null;
    //   console.log("BingxService auto-refresh stopped");
    // }
  }

  private async loadData() {
    console.log("[Bitget] loadData");
    // if (!this.data.transactions.length) {
    //   const cachedData = await this.cacheService.loadTransactions();
    //   this.data.transactions = cachedData?.data ?? [];

    //   console.log({ transactions: cachedData?.data?.length });
    // }
    // if (!this.data.trades.length) {
    //   const cachedData = await this.cacheService.loadTrades();
    //   this.data.trades = cachedData?.data ?? [];

    //   console.log({ trades: cachedData?.data?.length });
    // }

    const cacheTransactions: FuturesTransactionRecordV2[] = [];

    const bitgetTransactions =
      await this.restClient.fetchTransactions(cacheTransactions);
    // this.data.trades = await this.restClient.fetchTrades(this.data.trades);
    const bitgetBalance = await this.restClient.fetchBalance();
    // this.data.positions = await this.restClient.fetchPositions();
    // this.data.contracts = await this.restClient.fetchContracts();

    // await this.cacheService.saveTransactions(this.data.transactions);
    // await this.cacheService.saveTrades(this.data.trades);

    this.data.transactions = this.transactionsTransform(bitgetTransactions);
    this.data.balance = this.balanceTransform(bitgetBalance);

    this.notifyClients({
      store: "bitget.transactions",
      transactions: this.data.transactions,
    });
    // this.notifyClients({ store: "bitget.trades", trades: this.data.trades });
    this.notifyClients({ store: "bitget.balance", balance: this.data.balance });
    // this.notifyClients({ store: "bitget.positions", positions: this.data.positions });
    // this.notifyClients({ store: "bitget.contracts", contracts: this.data.contracts });
  }

  private balanceTransform(balance: FuturesAccountsV2): Balance {
    return {
      symbol: balance.marginCoin,
      availableMargin: balance.crossedMaxAvailable,
      balance: balance.available + balance.locked,
      equity: balance.accountEquity,
      freezedMargin: balance.locked,
      realisedPnl: "0",
      unrealizedPnl: balance.unrealizedPL,
      usedMargin: balance.crossedMargin,
    };
  }

  private transactionsTransform(
    transactions: FuturesTransactionRecordV2[],
  ): Transaction[] {
    return [];
  }

  // async loadSymbolKLines(symbol: string, period: Period) {
  //   if (!this.data.kLines[symbol])
  //     this.data.kLines[symbol] = { socketId: uuidv4(), data: [] };
  //   const kLines = await this.restClient.fetchKLines(symbol, period);
  //   this.data.kLines[symbol].data = kLines;

  //   this.notifyClients({
  //     store: "klines",
  //     symbol,
  //     period,
  //     klines: this.data.kLines[symbol].data,
  //   });
  //   await this.wsClient.subscribe(
  //     this.data.kLines[symbol].socketId,
  //     `${symbol}@kline_${period}`,
  //   );
  // }

  // private processWSEventKline(message: KLineDataEvent) {
  //   const match = message.dataType.match(klineRegex);
  //   if (match) {
  //     const symbol = match[1];
  //     const period = match[2] as Period;
  //     if (symbol && period) {
  //       const klineData = this.data.kLines[symbol].data;

  //       message.data.forEach((kline) => {
  //         if (klineData[0].time === kline.T) {
  //           klineData[0].close = kline.c;
  //           klineData[0].high = kline.h;
  //           klineData[0].low = kline.l;
  //           klineData[0].open = kline.o;
  //           klineData[0].volume = kline.v;
  //         } else {
  //           klineData.unshift({
  //             time: kline.T,
  //             open: kline.o,
  //             high: kline.h,
  //             low: kline.l,
  //             close: kline.c,
  //             volume: kline.v,
  //           });
  //         }
  //       });

  //       // console.log(symbol, {
  //       //   ini: this.data.kLines[symbol].data[0].close,
  //       //   end: this.data.kLines[symbol].data[
  //       //     this.data.kLines[symbol].data.length - 1
  //       //   ].close,
  //       // });
  //       this.notifyClients({
  //         store: "klines",
  //         symbol,
  //         period,
  //         klines: this.data.kLines[symbol].data,
  //       });
  //     }
  //   }
  // }

  // private handleWebSocketMessage(message: WebSocketMessage) {
  //   const logMessage = false;
  //   if ("e" in message) {
  //     if (message.e === "SNAPSHOT") {
  //       //console.log("TODO", message.e);
  //       return;
  //     }
  //     if (message.e === "TRADE_UPDATE") {
  //       console.log(
  //         "TODO[TRADE_UPDATE]",
  //         logMessage && JSON.stringify(message, null, 2),
  //       );

  //       return;
  //     }
  //     if (message.e === "ORDER_TRADE_UPDATE") {
  //       console.log(
  //         "TODO[ORDER_TRADE_UPDATE]",
  //         logMessage && JSON.stringify(message, null, 2),
  //       );
  //       this.startAutoRefresh();
  //       return;
  //     }
  //     if (message.e === "ACCOUNT_UPDATE") {
  //       console.log(
  //         "TODO[ACCOUNT_UPDATE]",
  //         logMessage && JSON.stringify(message, null, 2),
  //       );
  //       return;
  //     }
  //   }
  //   if ("dataType" in message) {
  //     if (message.dataType === "") return;
  //     if (klineRegex.test(message.dataType)) {
  //       return this.processWSEventKline(message as KLineDataEvent);
  //     }
  //   }
  //   console.log("handleWebSocketMessage", message);
  // }

  private notifyClients(message: NotifyMessage) {
    // console.log("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`update-data`, message);
      }
    });
  }
}
