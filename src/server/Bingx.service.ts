import { BrowserWindow } from "electron";
import {
  Balance,
  KLine,
  NotifyMessage,
  Period,
  Position,
  Trade,
  Transaction,
} from "./BingX.dto";
import { v4 as uuidv4 } from "uuid";
import { BingXRestClient } from "./BingxRest.client";
import { BingXWebSocket } from "./BingxWebSocket.client";
import { KLineDataEvent, WebSocketMessage } from "./BingX.ws.dto";

const klineRegex = /^([A-Z0-9]*-[A-Z0-9]*)?@kline_([1-9]*[mhdwM]*)?$/;

export class BingXService {
  private readonly restClient: BingXRestClient;
  private readonly wsClient: BingXWebSocket;
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
  } = {
    transactions: [],
    trades: [],
    kLines: {},
    balance: undefined,
    positions: [],
  };

  constructor(apiKey: string, apiSecret: string) {
    this.restClient = new BingXRestClient(apiKey, apiSecret);
    console.log("BingXService constructor ");
    this.wsClient = new BingXWebSocket(
      this.restClient,
      this.handleWebSocketMessage.bind(this),
    );
  }

  setCredentials(apiKey: string, apiSecret: string) {
    this.restClient.setCredentials(apiKey, apiSecret);
    this.wsClient.updateListenKey();
  }

  async loadInitDate() {
    console.log("loadInitDate");
    this.data.transactions = await this.restClient.fetchTransactions();
    this.data.trades = await this.restClient.fetchTrades();
    this.data.balance = await this.restClient.fetchBalance();
    this.data.positions = await this.restClient.fetchPositions();

    this.notifyClients({
      store: "transactions",
      transactions: this.data.transactions,
    });
    this.notifyClients({ store: "trades", trades: this.data.trades });
    this.notifyClients({ store: "balance", balance: this.data.balance });
    this.notifyClients({ store: "positions", positions: this.data.positions });
  }

  async loadSymbolKLines(symbol: string, period: Period) {
    if (!this.data.kLines[symbol])
      this.data.kLines[symbol] = { socketId: uuidv4(), data: [] };
    const kLines = await this.restClient.fetchKLines(symbol, period);
    this.data.kLines[symbol].data = kLines;

    this.notifyClients({
      store: "klines",
      symbol,
      period,
      klines: this.data.kLines[symbol].data,
    });
    this.wsClient.subscribe(
      this.data.kLines[symbol].socketId,
      `${symbol}@kline_${period}`,
    );
  }

  private processWSEventKline(message: KLineDataEvent) {
    const match = message.dataType.match(klineRegex);
    if (match) {
      const symbol = match[1];
      const period = match[2] as Period;
      if (symbol && period) {
        const klineData = this.data.kLines[symbol].data;

        message.data.forEach((kline) => {
          if (klineData[0].time === kline.T) {
            klineData[0].close = kline.c;
            klineData[0].high = kline.h;
            klineData[0].low = kline.l;
            klineData[0].open = kline.o;
            klineData[0].volume = kline.v;
          } else {
            klineData.unshift({
              time: kline.T,
              open: kline.o,
              high: kline.h,
              low: kline.l,
              close: kline.c,
              volume: kline.v,
            });
          }
        });

        this.notifyClients({
          store: "klines",
          symbol,
          period,
          klines: this.data.kLines[symbol].data,
        });
      }
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    if ("e" in message) {
      if (message.e === "SNAPSHOT") {
        //console.log("TODO", message.e);
        return;
      }
      if (message.e === "TRADE_UPDATE") {
        console.log("TODO", message.e);
        return;
      }
      if (message.e === "ORDER_TRADE_UPDATE") {
        console.log("TODO", message.e);
        return;
      }
      if (message.e === "ACCOUNT_UPDATE") {
        console.log("TODO", message.e);
        return;
      }
    }
    if ("dataType" in message) {
      if (message.dataType === "") return;
      if (klineRegex.test(message.dataType)) {
        return this.processWSEventKline(message as KLineDataEvent);
      }
    }
    console.log("handleWebSocketMessage", message);
  }

  private notifyClients(message: NotifyMessage) {
    // console.log("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(`update-data`, message);
    });
  }
}
