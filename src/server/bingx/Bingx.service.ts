import { BrowserWindow } from 'electron'
import {
  Balance,
  Contract,
  KLine,
  Period,
  Position,
  Trade,
  Transaction,
} from '../data.dto'
import { v4 as uuidv4 } from 'uuid'
import { BingxRestClient } from './BingxRest.client'
import { BingxWebSocket } from './BingxWebSocket.client'
import { KLineDataEvent, WebSocketMessage } from './Bingx.ws.dto'
import { CacheService } from '../Cache.service'
import { NotifyMessage } from '../messages.dto'
import { BingxTrade, BingxTransaction } from './Bingx.dto'
import { BingxCacheService } from './Bingx.cache'
import { BingxTransformer } from './Bingx.transformer'
import { LoggerService } from '../../utils/Logger'
import { ExchangeService } from '../base/Exchange.service'
import { ObjectSize } from '../../utils/ObjectSize'

const klineRegex = /^([A-Z0-9]*-[A-Z0-9]*)?@kline_([1-9]*[mhdwM]*)?$/

export class BingxService implements ExchangeService {
  private readonly logger: LoggerService
  private readonly restClient: BingxRestClient
  private readonly wsClient: BingxWebSocket
  private readonly cacheService: BingxCacheService
  private refreshInterval: NodeJS.Timeout | null = null
  private originalData: {
    transactions: BingxTransaction[]
    trades: BingxTrade[]
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

  constructor(apiKey: string, apiSecret: string) {
    this.logger = new LoggerService(BingxService.name)
    this.logger.debug('BingxService constructor ')
    if (!this.restClient) {
      this.restClient = new BingxRestClient(apiKey, apiSecret)
    }
    if (!this.wsClient)
      this.wsClient = new BingxWebSocket(
        this.restClient,
        this.handleWebSocketMessage.bind(this),
      )
    this.cacheService = new BingxCacheService(new CacheService())
    if (apiKey && apiSecret) {
      this.cacheService.setHashCode(this.restClient.hashCode)
    }
  }

  setCredentials(apiKey: string, apiSecret: string) {
    this.restClient.setCredentials(apiKey, apiSecret)
    this.wsClient.updateListenKey()
    this.cacheService.setHashCode(this.restClient.hashCode)
  }

  startAutoRefresh(intervalMs = 60000) {
    this.stopAutoRefresh()
    this.loadData()

    this.refreshInterval = setInterval(async () => {
      try {
        await this.loadData()
      } catch (error) {
        console.error('BingxService auto-refresh failed:', error)
      }
    }, intervalMs)

    this.logger.debug(
      `BingxService auto-refresh started: every ${intervalMs / 1000} seconds`,
    )
  }

  stopWebSocket() {
    this.wsClient.stop()
  }
  stopAutoRefresh() {
    this.stopWebSocket()
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      this.logger.debug('BingxService auto-refresh stopped')
    }
  }

  private async loadData() {
    this.logger.debug('[BingX] loadData')
    if (!this.originalData.transactions.length) {
      const cachedData = await this.cacheService.loadBingxTransactions()
      this.originalData.transactions = cachedData?.data ?? []
      this.logger.debug(
        `Cache transactions: ${this.originalData.transactions.length}`,
      )
    }
    if (!this.originalData.trades.length) {
      const cachedData = await this.cacheService.loadBingxTrades()
      this.originalData.trades = cachedData?.data ?? []

      this.logger.debug(`Cache trades: ${this.originalData.trades.length}`)
    }

    // Fetch data
    this.originalData.transactions = await this.restClient.fetchTransactions(
      this.originalData.transactions,
    )
    this.originalData.trades = await this.restClient.fetchTrades(
      this.originalData.trades,
    )
    const bingxBalance = await this.restClient.fetchBalance()
    const bingxPositions = await this.restClient.fetchPositions()
    const bingxContracts = await this.restClient.fetchContracts()

    await this.cacheService.saveBingxTransactions(
      this.originalData.transactions,
    )
    await this.cacheService.saveBingxTrades(this.originalData.trades)

    // Transforms
    this.data.transactions = BingxTransformer.transactionsTransform(
      this.originalData.transactions,
    )
    this.data.trades = BingxTransformer.tradesTransform(
      this.originalData.trades,
    )
    this.data.balance = BingxTransformer.balanceTransform(bingxBalance)
    this.data.positions = BingxTransformer.positionsTransform(bingxPositions)
    this.data.contracts = BingxTransformer.contractsTransform(bingxContracts)

    // Notify clients
    this.notifyClients({
      store: 'bingx.transactions',
      transactions: this.data.transactions,
    })
    this.notifyClients({ store: 'bingx.trades', trades: this.data.trades })
    this.notifyClients({ store: 'bingx.balance', balance: this.data.balance })
    this.notifyClients({
      store: 'bingx.positions',
      positions: this.data.positions,
    })
    this.notifyClients({
      store: 'bingx.contracts',
      contracts: this.data.contracts,
    })

    this.logger.info(
      `Data loaded: ${ObjectSize.calculate(this.data)} originalData: ${ObjectSize.calculate(this.originalData)}`,
    )
  }

  async loadSymbolKLines(symbol: string, period: Period) {
    if (!this.data.kLines[symbol])
      this.data.kLines[symbol] = { socketId: uuidv4(), data: [] }
    const kLines = await this.restClient.fetchKLines(symbol, period)
    this.data.kLines[symbol].data = BingxTransformer.klineTransform(kLines)

    this.notifyClients({
      store: 'bingx.klines',
      symbol,
      period,
      klines: this.data.kLines[symbol].data,
    })

    await this.wsClient.subscribe(
      this.data.kLines[symbol].socketId,
      `${symbol.replace('USDT', '-USDT')}@kline_${period}`,
    )
  }

  async removeSymbolKLines(symbol: string, period: Period) {
    if (this.data.kLines[symbol]) {
      this.data.kLines[symbol].data = []
      this.notifyClients({
        store: 'bingx.klines',
        symbol,
        period,
        klines: this.data.kLines[symbol].data,
      })

      await this.wsClient.unsubscribe(
        this.data.kLines[symbol].socketId,
        `${symbol.replace('USDT', '-USDT')}@kline_${period}`,
      )
    }
  }

  private processWSEventKline(message: KLineDataEvent) {
    const match = message.dataType.match(klineRegex)
    if (match) {
      const symbol = match[1].replace('-', '')
      const period = match[2] as Period

      if (symbol && period) {
        const klineData = this.data.kLines[symbol].data

        message.data.forEach((kline) => {
          if (klineData[0]?.timestamp === kline.T) {
            klineData[0].close = parseFloat(kline.c)
            klineData[0].high = parseFloat(kline.h)
            klineData[0].low = parseFloat(kline.l)
            klineData[0].open = parseFloat(kline.o)
            klineData[0].volume = parseFloat(kline.v)
          } else {
            klineData.unshift({
              timestamp: kline.T,
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v),
            })
          }
        })

        if (this.data.kLines[symbol].data.length > 1000)
          this.data.kLines[symbol].data.pop()

        // this.logger.debug(symbol, {
        //   ini: this.data.kLines[symbol].data[0].close,
        //   end: this.data.kLines[symbol].data[
        //     this.data.kLines[symbol].data.length - 1
        //   ].close,
        // });
        this.notifyClients({
          store: 'bingx.klines',
          symbol,
          period,
          klines: this.data.kLines[symbol].data,
        })
      }
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    const logMessage = false
    if ('e' in message) {
      if (message.e === 'SNAPSHOT') {
        //this.logger.debug("TODO", message.e);
        return
      }
      if (message.e === 'TRADE_UPDATE') {
        this.logger.debug(
          `TODO[TRADE_UPDATE] ${logMessage && JSON.stringify(message, null, 2)}`,
        )

        return
      }
      if (message.e === 'ORDER_TRADE_UPDATE') {
        this.logger.debug(
          `TODO[ORDER_TRADE_UPDATE] ${logMessage && JSON.stringify(message, null, 2)}`,
        )
        this.startAutoRefresh()
        return
      }
      if (message.e === 'ACCOUNT_UPDATE') {
        this.logger.debug(
          `TODO[ACCOUNT_UPDATE] ${logMessage && JSON.stringify(message, null, 2)}`,
        )
        return
      }
    }
    if ('dataType' in message) {
      if (message.dataType === '') return
      if (klineRegex.test(message.dataType)) {
        return this.processWSEventKline(message as KLineDataEvent)
      }
    }
    this.logger.debug(
      `handleWebSocketMessage ${JSON.stringify(message, null, 2)}`,
    )
  }

  private notifyClients(message: NotifyMessage) {
    // this.logger.debug("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`update-data`, message)
      }
    })
  }
}
