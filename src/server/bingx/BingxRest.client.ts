// eslint-disable-next-line import/no-unresolved
import axios from 'axios'
import CryptoJS from 'crypto-js'
import { limiter } from '../../utils/apiLimiter'
import { HashLib } from '../../utils/HashLib'
import {
  BingxBalance,
  BingxContract,
  BingxKLine,
  BingxListenKey,
  BingxPeriod,
  BingxPosition,
  BingxTrade,
  BingxTransaction,
} from './Bingx.dto'
import { subYears } from 'date-fns'
import { LoggerService } from '../../utils/Logger'
import { ExchangeRestService } from '../base/ExchangeRest.service'

export type BingXApiRequest = {
  path: string
  method: 'GET' | 'POST' | 'PUT'
  payload: Record<string, string>
  protocol: 'https'
}

export class BingxRestClient
  implements
    ExchangeRestService<
      BingxTransaction,
      BingxTrade,
      BingxBalance,
      BingxContract,
      BingxPosition,
      BingxKLine
    >
{
  private readonly logger: LoggerService
  //   private bingx: bingx
  private API_KEY: string
  private API_SECRET: string
  private readonly HOST = 'open-api.bingx.com'

  constructor(apiKey: string, apiSecret: string) {
    this.logger = new LoggerService(BingxRestClient.name)
    this.API_KEY = apiKey
    this.API_SECRET = apiSecret
  }
  setCredentials(apiKey: string, apiSecret: string) {
    this.API_KEY = apiKey
    this.API_SECRET = apiSecret
  }

  get hashCode() {
    return HashLib.generateHash(
      JSON.stringify({
        API_KEY: this.API_KEY,
        API_SECRET: this.API_SECRET,
      }),
    )
  }

  private getParameters(
    params: Record<string, string>,
    timestamp: number,
    urlEncode = false,
  ) {
    let parameters = ''
    for (const key in params) {
      if (urlEncode) {
        parameters += key + '=' + encodeURIComponent(params[key]) + '&'
      } else {
        parameters += key + '=' + params[key] + '&'
      }
    }
    if (parameters) {
      parameters = parameters.substring(0, parameters.length - 1)
      parameters = parameters + '&timestamp=' + timestamp
    } else {
      parameters = 'timestamp=' + timestamp
    }
    return parameters
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async bingxRequest<T>(API: BingXApiRequest) {
    const timestamp = Date.now() - (Date.now() % 1000)
    const sign = CryptoJS.enc.Hex.stringify(
      CryptoJS.HmacSHA256(
        this.getParameters(API.payload, timestamp),
        this.API_SECRET,
      ),
    )
    const params = this.getParameters(API.payload, timestamp, true)
    const url = `${API.protocol}://${this.HOST}${API.path}?${params}&signature=${sign}`

    const config = {
      method: API.method,
      url,
      headers: { 'X-BX-APIKEY': this.API_KEY },
    }
    return await limiter.schedule(async (): Promise<T> => {
      try {
        const resp = await axios.request<{
          code: number
          msg: string
          data: T
        }>(config)

        if (API.method === 'POST') {
          if (resp.status !== 200) {
            console.error(
              `BingX API POST error: ${resp.status}) - ${API.method} ${url}`,
            )
            return
          }
          return resp.data as T
        }

        if (API.method === 'PUT') {
          if (resp.status !== 200) {
            console.error(
              `BingX API PUT error: ${resp.status}) - ${API.method} ${url}`,
            )
            return
          }
          return resp.data as T
        }

        const obj = resp.data
        if (obj.code !== 0) {
          console.error(
            `BingX API error: ${obj.msg} (${obj.code}) - ${API.method} ${url}`,
          )
          return
        }

        return obj.data
      } catch (error: any) {
        if (error.response?.status === 429) {
          console.error('BingX API request error:', error.message)
          if (error.response.data.code === 100410) {
            console.error('Retry connection after 1 second')
            await this.sleep(1000)
            return this.bingxRequest<T>(API)
          }
        }
        console.error('BingX API request error:', error.response.data)
        return
      }
    })
  }

  async fetchTransactions(
    currentTransactions: BingxTransaction[],
  ): Promise<BingxTransaction[]> {
    const allTransactions: BingxTransaction[] = currentTransactions

    // Start with the current time
    const newestTransaction = allTransactions.length
      ? Math.max(...allTransactions.map((t) => t.time))
      : undefined
    let endTime = Date.now() - (Date.now() % 1000)
    const startTime = newestTransaction
      ? newestTransaction + 1000
      : subYears(new Date(), 10).getTime()
    let hasMoreData = true
    let page = 1
    const limit = 1000

    do {
      try {
        this.logger.debug(
          `[fetchTransactions] Fetching page ${page}, startTime ${startTime} ` +
            `${new Date(startTime).toISOString()}, endTime ${endTime} ` +
            `${new Date(endTime).toISOString()} transactions so far: ${allTransactions.length}`,
        )

        const API: BingXApiRequest = {
          path: '/openApi/swap/v2/user/income',
          method: 'GET',
          payload: {
            limit: limit.toString(),
            startTime: startTime.toString(),
            endTime: endTime.toString(),
          },
          protocol: 'https',
        }

        const transactions = await this.bingxRequest<BingxTransaction[]>(API)

        if (!transactions || transactions.length === 0) {
          hasMoreData = false
          continue
        }

        // Add to our collection
        allTransactions.push(...transactions)

        // Find the oldest transaction timestamp for next pagination request
        const oldestTransaction = Math.min(...transactions.map((t) => t.time))

        // Set end time to just before the oldest transaction time
        endTime = oldestTransaction - 1

        page++

        if (transactions.length < limit) {
          hasMoreData = false
          continue
        }
      } catch (error) {
        console.error('Error during pagination:', error)
        hasMoreData = false
      }
    } while (hasMoreData)

    this.logger.debug(` Total transactions fetched: ${allTransactions.length}`)
    return allTransactions.toSorted((a, b) => b.time - a.time)
  }

  async fetchTrades(currentTrades: BingxTrade[]): Promise<BingxTrade[]> {
    // this.logger.debug('fetchTrades', {
    //   apiKey: this.API_KEY,
    //   apiSecret: this.API_SECRET,
    // })
    const allTrades: BingxTrade[] = currentTrades

    // Start with the current time
    const newestTransaction = allTrades.length
      ? Math.max(...allTrades.map((t) => new Date(t.filledTime).getTime()))
      : undefined
    let endTime = Date.now() - (Date.now() % 1000)
    const startTime = newestTransaction ?? subYears(new Date(), 10).getTime()
    let hasMoreData = true
    let page = 1
    const limit = 1000

    do {
      try {
        this.logger.debug(
          `[fetchTrades] Fetching page ${page}, startTime ${startTime} ` +
            `${new Date(startTime).toISOString()}, endTime ${endTime} ` +
            `${new Date(endTime).toISOString()} transactions so far: ${allTrades.length}`,
        )

        const API: BingXApiRequest = {
          path: '/openApi/swap/v2/trade/fillHistory',
          method: 'GET',
          payload: {
            pageSize: limit.toString(),
            startTs: startTime.toString(),
            endTs: endTime.toString(),
          },
          protocol: 'https',
        }

        const trades = await this.bingxRequest<{
          fill_history_orders: BingxTrade[]
        }>(API)

        if (!trades || trades.fill_history_orders?.length === 0) {
          hasMoreData = false
          continue
        }

        // Add to our collection
        for (const trade of trades.fill_history_orders) {
          const founded = allTrades.some(
            (x) => x.orderId === trade.orderId && x.tradeId === trade.tradeId,
          )
          if (!founded) allTrades.push(trade)
        }

        // Find the oldest transaction timestamp for next pagination request
        const oldestTransaction = Math.min(
          ...trades.fill_history_orders.map((t) =>
            new Date(t.filledTime).getTime(),
          ),
        )

        // Set end time to just before the oldest transaction time
        endTime = oldestTransaction - 1

        page++

        if (trades.fill_history_orders.length < limit) {
          hasMoreData = false
          continue
        }
      } catch (error) {
        console.error('Error during pagination:', error)
        hasMoreData = false
      }
    } while (hasMoreData)

    // console.log(allTrades.filter((x) => x.symbol.includes('AERGO')))

    this.logger.debug(`Total trades fetched: ${allTrades?.length ?? 'ERROR'}`)
    return allTrades.toSorted(
      (a, b) =>
        new Date(b.filledTime).getTime() - new Date(a.filledTime).getTime(),
    )
  }

  async fetchBalance(): Promise<BingxBalance> {
    const API: BingXApiRequest = {
      path: '/openApi/swap/v3/user/balance',
      method: 'GET',
      payload: {},
      protocol: 'https',
    }
    const balance = await this.bingxRequest<BingxBalance[]>(API)
    this.logger.debug(`[fetchBalance] Fetched balance ${!!balance}`)
    return balance?.find((x) => x.asset === 'USDT')
  }

  async fetchContracts(): Promise<BingxContract[]> {
    const API: BingXApiRequest = {
      path: '/openApi/swap/v2/quote/contracts',
      method: 'GET',
      payload: {},
      protocol: 'https',
    }
    const contracts = await this.bingxRequest<BingxContract[]>(API)
    this.logger.debug(`[fetchContracts] Fetched contracts ${!!contracts}`)
    return contracts
  }

  async fetchPositions(): Promise<BingxPosition[]> {
    const API: BingXApiRequest = {
      path: '/openApi/swap/v2/user/positions',
      method: 'GET',
      payload: {},
      protocol: 'https',
    }
    const positions = await this.bingxRequest<BingxPosition[]>(API)
    this.logger.debug(`[fetchPositions] Fetched positions ${!!positions}`)
    // console.log(positions.filter((x) => x.symbol.includes('AERGO')))
    return positions
  }

  async fetchKLines(
    symbol: string,
    period: BingxPeriod,
  ): Promise<BingxKLine[]> {
    const API: BingXApiRequest = {
      path: '/openApi/swap/v3/quote/klines',
      method: 'GET',
      payload: {
        symbol: symbol.replace('USDT', '-USDT'),
        interval: period,
        limit: '1000',
      },
      protocol: 'https',
    }
    const klines = await this.bingxRequest<BingxKLine[]>(API)
    this.logger.debug(
      `[fetchLines][${symbol}][${period}] Fetched klines ${klines?.length ?? 'ERROR'}`,
    )
    if (!klines) return []

    return klines
  }

  async getWSListenKey(): Promise<string> {
    const API: BingXApiRequest = {
      path: '/openApi/user/auth/userDataStream',
      method: 'POST',
      payload: {},
      protocol: 'https',
    }
    const listenKeyData = await this.bingxRequest<BingxListenKey>(API)
    this.logger.debug(
      `[fetchBalance] Fetched getWSListenKey ${listenKeyData?.listenKey}`,
    )
    return listenKeyData.listenKey
  }

  async extendWSListenKey(listenKey: string): Promise<void> {
    const API: BingXApiRequest = {
      path: '/openApi/user/auth/userDataStream',
      method: 'PUT',
      payload: {
        listenKey,
      },
      protocol: 'https',
    }
    await this.bingxRequest<BingxListenKey>(API)
    this.logger.debug(`[fetchBalance] Extended listenKey`)
  }
}
