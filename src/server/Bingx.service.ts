// eslint-disable-next-line import/no-unresolved
import axios from 'axios'
import CryptoJS from 'crypto-js'
import { subDays } from 'date-fns'

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

type IApi = {
  path: string
  method: string
  payload: Record<string, string>
  protocol: string
}

export class BingXService {
  //   private bingX: bingx
  private API_KEY: string
  private API_SECRET: string
  private HOST: string

  constructor() {
    this.API_KEY = process.env.BINGX_API_KEY
    this.API_SECRET = process.env.BINGX_SECRET_KEY
    this.HOST = 'open-api.bingx.com'
  }
  async fetchMyTrades(): Promise<Transaction[]> {
    const allTransactions: Transaction[] = []

    // Start with the current time
    let endTime = Date.now()
    let hasMoreData = true
    let page = 1
    const limit = 1000

    do {
      try {
        console.log(
          `Fetching page ${page}, endTime${endTime} transactions so far: ${allTransactions.length}`
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

        if (transactions.length === 0) {
          // No more data
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

        // Safety check - if we're going too far back, stop
        if (transactions.length < limit) {
          // 90 days
          console.log('Last page, stopping pagination')
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

  async fetchBalance(): Promise<Balance> {
    const API: IApi = {
      path: '/openApi/swap/v3/user/balance',
      method: 'GET',
      payload: {},
      protocol: 'https',
    }
    console.log(`Fetched balance`)
    const balance = await this.bingXRequest<Balance>(API)
    return balance
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
    console.log(API.method, url)
    const config = {
      method: API.method,
      url,
      headers: { 'X-BX-APIKEY': this.API_KEY },
    }
    const resp = await axios.request<{
      code: number
      msg: string
      data: T
    }>(config)
    const obj = resp.data
    return obj.data
  }
}
