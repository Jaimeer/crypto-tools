import { BrowserWindow } from "electron";
import {
  Balance,
  Contract,
  KLine,
  Period,
  Position,
  Trade,
  Transaction,
} from "../data.dto";
import { v4 as uuidv4 } from "uuid";
import { BingXRestClient } from "./BingxRest.client";
import { BingXWebSocket } from "./BingxWebSocket.client";
import { KLineDataEvent, WebSocketMessage } from "./Bingx.ws.dto";
import { CacheService } from "../Cache.service";
import { NotifyMessage } from "../messages.dto";
import { BingxBalance, BingxTrade, BingxTransaction } from "./Bingx.dto";
import { BingxCacheService } from "./Bingx.cache";

const klineRegex = /^([A-Z0-9]*-[A-Z0-9]*)?@kline_([1-9]*[mhdwM]*)?$/;

export class BingXService {
  private readonly restClient: BingXRestClient;
  private readonly wsClient: BingXWebSocket;
  private readonly cacheService: BingxCacheService;
  private refreshInterval: NodeJS.Timeout | null = null;
  private originalData: {
    transactions: BingxTransaction[];
    trades: BingxTrade[];
  } = {
    transactions: [],
    trades: [],
  };
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

  constructor(apiKey: string, apiSecret: string) {
    console.log("[Bingx] BingXService constructor ");
    if (!this.restClient) {
      this.restClient = new BingXRestClient(apiKey, apiSecret);
    }
    if (!this.wsClient)
      this.wsClient = new BingXWebSocket(
        this.restClient,
        this.handleWebSocketMessage.bind(this),
      );
    this.cacheService = new BingxCacheService(new CacheService());
    if (apiKey && apiSecret) {
      this.cacheService.setHashCode(this.restClient.hashCode);
    }
  }

  setCredentials(apiKey: string, apiSecret: string) {
    this.restClient.setCredentials(apiKey, apiSecret);
    this.wsClient.updateListenKey();
    this.cacheService.setHashCode(this.restClient.hashCode);
  }

  startAutoRefresh(intervalMs = 60000) {
    this.stopAutoRefresh();
    this.loadData();

    this.refreshInterval = setInterval(async () => {
      try {
        await this.loadData();
      } catch (error) {
        console.error("[Bingx] BingxService auto-refresh failed:", error);
      }
    }, intervalMs);

    console.log(
      `[Bingx] BingxService auto-refresh started: every ${intervalMs / 1000} seconds`,
    );
  }

  stopWebSocket() {
    this.wsClient.stop();
  }
  stopAutoRefresh() {
    this.stopWebSocket();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log("[Bingx] BingxService auto-refresh stopped");
    }
  }

  private transactionsTransform(
    transactions: BingxTransaction[],
  ): Transaction[] {
    return transactions.map((transaction) => ({
      symbol: transaction.symbol,
      incomeType: transaction.incomeType,
      income: parseFloat(transaction.income),
      asset: transaction.asset,
      info: transaction.info,
      time: transaction.time,
      tranId: transaction.tranId,
      tradeId: transaction.tradeId,
    }));
  }

  private tradesTransform(trades: BingxTrade[]): Trade[] {
    return trades.map((trade) => ({
      symbol: trade.symbol,
      qty: parseFloat(trade.qty),
      price: parseFloat(trade.price),
      quoteQty: parseFloat(trade.quoteQty),
      commission: parseFloat(trade.commission),
      commissionAsset: trade.commissionAsset,
      orderId: trade.orderId,
      tradeId: trade.tradeId,
      filledTime: trade.filledTime,
      side: trade.side,
      positionSide: trade.positionSide,
      role: trade.role,
      total: trade.total,
      realisedPNL: parseFloat(trade.realisedPNL),
    }));
  }

  private async loadData() {
    console.log("[BingX] loadData");
    if (!this.originalData.transactions.length) {
      const cachedData = await this.cacheService.loadBingxTransactions();
      this.originalData.transactions = cachedData?.data ?? [];
      console.log("[Bingx] Cache", {
        transactions: this.originalData.transactions.length,
      });
    }
    if (!this.originalData.trades.length) {
      const cachedData = await this.cacheService.loadBingxTrades();
      this.originalData.trades = cachedData?.data ?? [];

      console.log("[Bingx] Cache", {
        trades: this.originalData.trades.length,
      });
    }

    this.originalData.transactions = await this.restClient.fetchTransactions(
      this.originalData.transactions,
    );
    this.originalData.trades = await this.restClient.fetchTrades(
      this.originalData.trades,
    );
    const bingxBalance = await this.restClient.fetchBalance();
    this.data.positions = await this.restClient.fetchPositions();
    this.data.contracts = await this.restClient.fetchContracts();

    this.data.balance = this.balanceTransform(bingxBalance);

    await this.cacheService.saveBingxTransactions(
      this.originalData.transactions,
    );
    await this.cacheService.saveBingxTrades(this.originalData.trades);

    this.data.transactions = this.transactionsTransform(
      this.originalData.transactions,
    );
    this.data.trades = this.tradesTransform(this.originalData.trades);

    this.notifyClients({
      store: "bingx.transactions",
      transactions: this.data.transactions,
    });
    this.notifyClients({ store: "bingx.trades", trades: this.data.trades });
    this.notifyClients({ store: "bingx.balance", balance: this.data.balance });
    this.notifyClients({
      store: "bingx.positions",
      positions: this.data.positions,
    });
    this.notifyClients({
      store: "bingx.contracts",
      contracts: this.data.contracts,
    });
  }

  private balanceTransform(balance: BingxBalance): Balance {
    return {
      symbol: balance.asset,
      availableMargin: balance.availableMargin,
      balance: balance.balance,
      equity: balance.equity,
      freezedMargin: balance.freezedMargin,
      realisedPnl: balance.realisedProfit,
      unrealizedPnl: balance.unrealizedProfit,
      usedMargin: balance.usedMargin,
    };
  }

  async loadSymbolKLines(symbol: string, period: Period) {
    if (!this.data.kLines[symbol])
      this.data.kLines[symbol] = { socketId: uuidv4(), data: [] };
    const kLines = await this.restClient.fetchKLines(symbol, period);
    this.data.kLines[symbol].data = kLines;

    this.notifyClients({
      store: "bingx.klines",
      symbol,
      period,
      klines: this.data.kLines[symbol].data,
    });
    await this.wsClient.subscribe(
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

        // console.log(symbol, {
        //   ini: this.data.kLines[symbol].data[0].close,
        //   end: this.data.kLines[symbol].data[
        //     this.data.kLines[symbol].data.length - 1
        //   ].close,
        // });
        this.notifyClients({
          store: "bingx.klines",
          symbol,
          period,
          klines: this.data.kLines[symbol].data,
        });
      }
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    const logMessage = false;
    if ("e" in message) {
      if (message.e === "SNAPSHOT") {
        //console.log("TODO", message.e);
        return;
      }
      if (message.e === "TRADE_UPDATE") {
        console.log(
          "[Bingx] TODO[TRADE_UPDATE]",
          logMessage && JSON.stringify(message, null, 2),
        );

        return;
      }
      if (message.e === "ORDER_TRADE_UPDATE") {
        console.log(
          "[Bingx] TODO[ORDER_TRADE_UPDATE]",
          logMessage && JSON.stringify(message, null, 2),
        );
        this.startAutoRefresh();
        return;
      }
      if (message.e === "ACCOUNT_UPDATE") {
        console.log(
          "[Bingx] TODO[ACCOUNT_UPDATE]",
          logMessage && JSON.stringify(message, null, 2),
        );
        return;
      }
    }
    if ("dataType" in message) {
      if (message.dataType === "") return;
      if (klineRegex.test(message.dataType)) {
        return this.processWSEventKline(message as KLineDataEvent);
      }
    }
    console.log("[Bingx] handleWebSocketMessage", message);
  }

  private notifyClients(message: NotifyMessage) {
    // console.log("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`update-data`, message);
      }
    });
  }
}
