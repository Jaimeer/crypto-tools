import { BrowserWindow } from 'electron'
import { NotifyMessage } from '../messages.dto'
import {
  Balance,
  Contract,
  KLine,
  Period,
  Position,
  Trade,
  Transaction,
} from '../data.dto'
import { BitgetRestClient } from './BitgetRest.client'
import { FuturesAccountBillV2, FuturesOrderFillV2 } from 'bitget-api'
import { BitgetCacheService } from './Bitget.cache'
import { CacheService } from '../Cache.service'
import { BitgetTransformer } from './Bitget.transformer'
import { LoggerService } from '../../utils/Logger'
import { ExchangeService } from '../base/Exchange.service'
import { ObjectSize } from '../../utils/ObjectSize'
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
// import { BitgetRestClient } from "./BitgetRest.client";
// import { BitgetWebSocket } from "./BitgetWebSocket.client";
// import { KLineDataEvent, WebSocketMessage } from "./Bitget.ws.dto";
// import { CacheService } from "./Cache.service";

// const klineRegex = /^([A-Z0-9]*-[A-Z0-9]*)?@kline_([1-9]*[mhdwM]*)?$/;

export class BitgetService implements ExchangeService {
  private readonly logger: LoggerService
  private readonly restClient: BitgetRestClient
  // private readonly wsClient: BitgetWebSocket;
  private readonly cacheService: BitgetCacheService
  private refreshInterval: NodeJS.Timeout | null = null
  private originalData: {
    transactions: FuturesAccountBillV2[]
    trades: FuturesOrderFillV2[]
  } = {
    transactions: [],
    trades: [],
  }
  private data: {
    transactions: Transaction[]
    trades: Trade[]
    kLines: Record<
      string,
      {
        socketId: string
        data: KLine[]
      }
    >
    balance: Balance | undefined
    positions: Position[]
    contracts: Contract[]
  } = {
    transactions: [],
    trades: [],
    kLines: {},
    balance: undefined,
    positions: [],
    contracts: [],
  }

  constructor(apiKey: string, apiSecret: string, password: string) {
    this.logger = new LoggerService(BitgetService.name)
    this.logger.debug('BitgetService constructor ')
    if (!this.restClient) {
      this.restClient = new BitgetRestClient(apiKey, apiSecret, password)
    }
    // if (!this.wsClient)
    //   this.wsClient = new BitgetWebSocket(
    //     this.restClient,
    //     this.handleWebSocketMessage.bind(this),
    //   );
    this.cacheService = new BitgetCacheService(new CacheService())
    if (apiKey && apiSecret && password) {
      this.cacheService.setHashCode(this.restClient.hashCode)
    }
  }

  setCredentials(apiKey: string, apiSecret: string, password: string) {
    this.restClient.setCredentials(apiKey, apiSecret, password)
    // this.wsClient.updateListenKey();
    // this.cacheService.setHashCode(this.restClient.hashCode);
  }

  startAutoRefresh(intervalMs = 60000) {
    this.stopAutoRefresh()
    this.loadData()
    this.refreshInterval = setInterval(async () => {
      try {
        await this.loadData()
      } catch (error) {
        console.error('BitgetService auto-refresh failed:', error)
      }
    }, intervalMs)
    this.logger.debug(
      `BitgetService auto-refresh started: every ${intervalMs / 1000} seconds`,
    )
  }

  stopWebSocket() {
    // this.wsClient.stop();
  }
  stopAutoRefresh() {
    this.stopWebSocket()
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      this.logger.debug('BitgetService auto-refresh stopped')
    }
  }

  private async loadData() {
    this.logger.debug('loadData')
    if (!this.originalData.transactions.length) {
      const cachedData = await this.cacheService.loadBitgetTransactions()
      this.originalData.transactions = cachedData?.data ?? []
      this.logger.debug(
        `Cache transactions ${this.originalData.transactions.length}`,
      )
    }
    if (!this.originalData.trades.length) {
      const cachedData = await this.cacheService.loadBitgetTrades()
      this.originalData.trades = cachedData?.data ?? []

      this.logger.debug(`Cache trades ${this.originalData.trades.length}`)
    }

    this.originalData.transactions = await this.restClient.fetchTransactions(
      this.originalData.transactions,
    )
    this.originalData.trades = await this.restClient.fetchTrades(
      this.originalData.trades,
    )
    const bitgetBalance = await this.restClient.fetchBalance()
    const bitgetPositions = await this.restClient.fetchPositions()
    const bitgetContracts = await this.restClient.fetchContracts()

    await this.cacheService.saveBitgetTransactions(
      this.originalData.transactions,
    )
    await this.cacheService.saveBitgetTrades(this.originalData.trades)

    this.data.transactions = BitgetTransformer.transactionsTransform(
      this.originalData.transactions,
    )
    this.data.trades = BitgetTransformer.tradesTransform(
      this.originalData.trades,
    )
    this.data.balance = BitgetTransformer.balanceTransform(bitgetBalance)
    this.data.positions = BitgetTransformer.positionsTransform(bitgetPositions)
    this.data.contracts = BitgetTransformer.contractsTransform(bitgetContracts)

    this.notifyClients({
      store: 'bitget.transactions',
      transactions: this.data.transactions,
    })
    this.notifyClients({ store: 'bitget.trades', trades: this.data.trades })
    this.notifyClients({ store: 'bitget.balance', balance: this.data.balance })
    this.notifyClients({
      store: 'bitget.positions',
      positions: this.data.positions,
    })
    this.notifyClients({
      store: 'bitget.contracts',
      contracts: this.data.contracts,
    })

    this.logger.info(
      `Data loaded: ${ObjectSize.calculate(this.data)} originalData: ${ObjectSize.calculate(this.originalData)}`,
    )
  }

  async loadSymbolKLines(symbol: string, period: Period) {
    this.logger.error(
      `loadSymbolKLines not implemented symbol[${symbol}] period[${period}]`,
    )
  }

  async removeSymbolKLines(symbol: string, period: Period) {
    this.logger.error(
      `removeSymbolKLines not implemented symbol[${symbol}] period[${period}]`,
    )
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

  //       // this.logger.debug(symbol, {
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
  //       //this.logger.debug("TODO", message.e);
  //       return;
  //     }
  //     if (message.e === "TRADE_UPDATE") {
  //       this.logger.debug(
  //         "TODO[TRADE_UPDATE]",
  //         logMessage && JSON.stringify(message, null, 2),
  //       );

  //       return;
  //     }
  //     if (message.e === "ORDER_TRADE_UPDATE") {
  //       this.logger.debug(
  //         "TODO[ORDER_TRADE_UPDATE]",
  //         logMessage && JSON.stringify(message, null, 2),
  //       );
  //       this.startAutoRefresh();
  //       return;
  //     }
  //     if (message.e === "ACCOUNT_UPDATE") {
  //       this.logger.debug(
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
  //   this.logger.debug("handleWebSocketMessage", message);
  // }

  private notifyClients(message: NotifyMessage) {
    // this.logger.debug("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`update-data`, message)
      }
    })
  }
}
