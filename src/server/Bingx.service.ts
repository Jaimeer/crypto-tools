// eslint-disable-next-line import/no-unresolved
import axios from 'axios'
import CryptoJS from 'crypto-js'
import { limiter } from '../utils/apiLimiter'

export type Transaction = {
  symbol: string
  incomeType:
    | 'TRANSFER'
    | 'REALIZED_PNL'
    | 'FUNDING_FEE'
    | 'TRADING_FEE'
    | 'INSURANCE_CLEAR'
    | 'TRIAL_FUND'
    | 'ADL'
    | 'SYSTEM_DEDUCTION'
    | 'GTD_PRICE'
  income: string
  asset: string
  info: string
  time: number
  tranId: string
  tradeId: string
}

export type Balance = {
  code: number
  msg: string
  asset: string
  balance: string
  equity: string
  unrealizedProfit: string
  realisedProfit: string
  availableMargin: string
  usedMargin: string
  freezedMargin: string
  shortUid: string
}

export type Trade = {
  symbol: string
  qty: string
  price: string
  quoteQty: string
  commission: string
  commissionAsset: string
  orderId: string
  tradeId: string
  filledTime: Date
  side: string
  positionSide: string
  role: string
  total: number
  realisedPNL: string
}

export type Position = {
  symbol: string
  positionId: string
  positionSide: string
  isolated: boolean
  positionAmt: string
  availableAmt: string
  unrealizedProfit: string
  realisedProfit: string
  initialMargin: string
  margin: string
  avgPrice: string
  liquidationPrice: number
  leverage: string
  positionValue: string
  markPrice: string
  riskRate: string
  maxMarginReduction: string
  pnlRatio: string
  updateTime: string
}

type IApi = {
  path: string
  method: string
  payload: Record<string, string>
  protocol: string
}

export type KLine = {
  open: string
  close: string
  high: string
  low: string
  volume: string
  time: number
}
export type Periods =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M'

export class BingXService {
  //   private bingX: bingx
  private API_KEY: string
  private API_SECRET: string
  private HOST: string

  constructor(apiKey: string, apiSecret: string) {
    this.API_KEY = apiKey
    this.API_SECRET = apiSecret
    this.HOST = 'open-api.bingx.com'
  }
  setCredentials(apiKey: string, apiSecret: string) {
    this.API_KEY = apiKey
    this.API_SECRET = apiSecret
  }

  async fetchTransactions(): Promise<Transaction[]> {
    // console.log('fetchTrades', {
    //   apiKey: this.API_KEY,
    //   apiSecret: this.API_SECRET,
    // })
    const allTransactions: Transaction[] = []

    // Start with the current time
    let endTime = Date.now()
    let hasMoreData = true
    let page = 1
    const limit = 1000

    do {
      try {
        console.log(
          `[fetchTransactions] Fetching page ${page}, endTime ${endTime} ` +
            `${new Date(endTime).toISOString()} transactions so far: ${allTransactions.length}`
        )

        const API: IApi = {
          path: '/openApi/swap/v2/user/income',
          method: 'GET',
          payload: {
            limit: limit.toString(),
            endTime: endTime.toString(),
          },
          protocol: 'https',
        }

        const transactions = await this.bingXRequest<Transaction[]>(API)

        if (!transactions || transactions.length === 0) {
          hasMoreData = false
          continue
        }

        // Add to our collection
        allTransactions.push(...transactions)

        // Find the oldest transaction timestamp for next pagination request
        const oldestTransaction = Math.min(...transactions.map(t => t.time))

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

    console.log(`Total transactions fetched: ${allTransactions.length}`)
    return allTransactions
  }

  async fetchTrades(): Promise<Trade[]> {
    // console.log('fetchTrades', {
    //   apiKey: this.API_KEY,
    //   apiSecret: this.API_SECRET,
    // })
    const allTrades: Trade[] = []

    // Start with the current time
    let hasMoreData = true
    let page = 1
    const limit = 1000

    do {
      try {
        console.log(`[fetchTrades] Fetching page ${page}, trades so far: ${allTrades.length}`)

        const API: IApi = {
          path: '/openApi/swap/v2/trade/fillHistory',
          method: 'GET',
          payload: {
            pageIndex: page.toString(),
            pageSize: limit.toString(),
          },
          protocol: 'https',
        }

        const trades = await this.bingXRequest<{ fill_history_orders: Trade[] }>(API)

        if (!trades || trades.fill_history_orders?.length === 0) {
          hasMoreData = false
          continue
        }

        // Add to our collection
        allTrades.push(...trades.fill_history_orders)

        // Set end time to just before the oldest trade time
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

    console.log(`Total trades fetched: ${allTrades.length}`)
    return allTrades
  }

  async fetchKLines(symbol: string, periods: Periods): Promise<KLine[]> {
    const API: IApi = {
      path: '/openApi/swap/v3/quote/klines',
      method: 'GET',
      payload: {
        symbol,
        interval: periods,
        limit: '1000',
      },
      protocol: 'https',
    }
    const klines = await this.bingXRequest<KLine[]>(API)
    console.log(`[fetchKlines][${symbol}][${periods}] Fetched klines ${klines.length}`)
    return klines
  }

  async fetchBalance(): Promise<Balance> {
    const API: IApi = {
      path: '/openApi/swap/v3/user/balance',
      method: 'GET',
      payload: {},
      protocol: 'https',
    }
    const balance = await this.bingXRequest<Balance>(API)
    console.log(`[fetchBalance] Fetched balance ${!!balance}`)
    return balance
  }

  async fetchPositions(): Promise<Position[]> {
    const API: IApi = {
      path: '/openApi/swap/v2/user/positions',
      method: 'GET',
      payload: {},
      protocol: 'https',
    }
    const positions = await this.bingXRequest<Position[]>(API)
    console.log(`[fetchPositions] Fetched positions ${!!positions}`)
    return positions
  }

  private getParameters(params: Record<string, string>, timestamp: number, urlEncode = false) {
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

  private async bingXRequest<T>(API: IApi) {
    const timestamp = new Date().getTime()
    const sign = CryptoJS.enc.Hex.stringify(
      CryptoJS.HmacSHA256(this.getParameters(API.payload, timestamp), this.API_SECRET)
    )
    const params = this.getParameters(API.payload, timestamp, true)
    const url = `${API.protocol}://${this.HOST}${API.path}?${params}&signature=${sign}`
    const config = {
      method: API.method,
      url,
      headers: { 'X-BX-APIKEY': this.API_KEY },
    }
    return await limiter.schedule(async () => {
      const resp = await axios.request<{
        code: number
        msg: string
        data: T
      }>(config)
      // console.log({
      //   status: resp.status,
      //   code: resp.data.code,
      //   msg: resp.data.msg,
      //   data: !!resp.data.data,
      // })
      const obj = resp.data
      return obj.data
    })
  }
}
