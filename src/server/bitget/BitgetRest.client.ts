// eslint-disable-next-line import/no-unresolved
import { subDays } from 'date-fns'
import { HashLib } from '../../utils/HashLib'
import {
  FuturesAccountBillV2,
  FuturesAccountsV2,
  FuturesContractConfigV2,
  FuturesOrderFillV2,
  FuturesPositionV2,
  RestClientV2,
} from 'bitget-api'
import { LoggerService } from '../../utils/Logger'
import { ExchangeRestService } from '../base/ExchangeRest.service'
import { Period } from '../data.dto'

export class BitgetRestClient
  implements
    ExchangeRestService<
      FuturesAccountBillV2,
      FuturesOrderFillV2,
      FuturesAccountsV2,
      FuturesContractConfigV2,
      FuturesPositionV2,
      unknown //BitgetKLine
    >
{
  private readonly logger: LoggerService
  //   private bingX: bitget
  private API_KEY: string
  private API_SECRET: string
  private PASSWORD: string
  private restClients: Record<string, RestClientV2> = {}

  constructor(apiKey: string, apiSecret: string, password: string) {
    this.logger = new LoggerService(BitgetRestClient.name)
    if (apiKey && apiSecret && password)
      this.setCredentials(apiKey, apiSecret, password)
  }

  setCredentials(apiKey: string, apiSecret: string, password: string) {
    this.API_KEY = apiKey
    this.API_SECRET = apiSecret
    this.PASSWORD = password

    const hash = this.hashCode
    if (!this.restClients[hash])
      this.restClients[hash] = new RestClientV2({
        apiKey: this.API_KEY,
        apiSecret: this.API_SECRET,
        apiPass: this.PASSWORD,
      })
  }

  get hashCode() {
    return HashLib.generateHash(
      JSON.stringify({
        API_KEY: this.API_KEY,
        API_SECRET: this.API_SECRET,
        PASSWORD: this.PASSWORD,
      }),
    )
  }

  private get client() {
    // this.logger.debug(this.restClients);
    const client = this.restClients[this.hashCode]
    if (!client) {
      this.logger.debug('No client found')
      return null
    }
    return client
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async fetchTransactions(
    currentTransactions: FuturesAccountBillV2[],
  ): Promise<FuturesAccountBillV2[]> {
    if (!this.client) return []
    const allTransactions: FuturesAccountBillV2[] = currentTransactions

    const newestTransaction = allTransactions.length
      ? Math.max(...allTransactions.map((t) => parseInt(t.cTime)))
      : undefined
    const startTime = newestTransaction
      ? newestTransaction + 1000
      : subDays(new Date(), 30).getTime()
    let hasMoreData = true
    let page = 1
    const limit = 100
    let idLessThan = ''

    do {
      try {
        this.logger.debug(
          `[fetchTransactions] Fetching page ${page}, ` +
            `idLessThan ${idLessThan} ` +
            `transactions so far: ${allTransactions.length}`,
        )

        const response = await this.client.getFuturesAccountBills({
          productType: 'USDT-FUTURES',
          limit: limit.toString(),
          idLessThan,
          startTime: startTime.toString(),
        })

        const transactions = response.data.bills
        idLessThan = response.data.endId

        if (!transactions || transactions.length === 0) {
          hasMoreData = false
          continue
        }

        allTransactions.push(...transactions)

        page++

        if (transactions.length < limit) {
          hasMoreData = false
          continue
        }
        await this.sleep(1000)
      } catch (error) {
        console.error('Error during pagination:', error)
        hasMoreData = false
      }

      this.logger.debug(`hasMoreData ${hasMoreData}`)
    } while (hasMoreData)

    this.logger.debug(`Total transactions fetched: ${allTransactions.length}`)
    return allTransactions.toSorted(
      (a, b) => parseInt(b.cTime) - parseInt(a.cTime),
    )
  }

  async fetchTrades(
    currentTrades: FuturesOrderFillV2[],
  ): Promise<FuturesOrderFillV2[]> {
    if (!this.client) return []
    const allTrades: FuturesOrderFillV2[] = currentTrades

    const newestTransaction = allTrades.length
      ? Math.max(...allTrades.map((t) => parseInt(t.cTime)))
      : undefined
    const startTime = newestTransaction
      ? newestTransaction + 1000
      : subDays(new Date(), 30).getTime()
    let hasMoreData = true
    let page = 1
    const limit = 100
    let idLessThan = ''

    do {
      try {
        this.logger.debug(
          `[fetchTrades] Fetching page ${page}, ` +
            `idLessThan ${idLessThan} ` +
            `trades so far: ${allTrades.length}`,
        )

        const response = await this.client.getFuturesHistoricOrderFills({
          productType: 'USDT-FUTURES',
          limit: limit.toString(),
          idLessThan,
          startTime: startTime.toString(),
        })

        const trades = response.data.fillList
        idLessThan = response.data.endId

        if (!trades || trades.length === 0) {
          hasMoreData = false
          continue
        }

        allTrades.push(...trades)

        page++

        if (trades.length < limit) {
          hasMoreData = false
          continue
        }
        await this.sleep(1000)
      } catch (error) {
        console.error('Error during pagination:', error)
        hasMoreData = false
      }

      this.logger.debug(`hasMoreData ${hasMoreData}`)
    } while (hasMoreData)

    this.logger.debug(`Total trades fetched: ${allTrades.length}`)
    return allTrades.toSorted((a, b) => parseInt(b.cTime) - parseInt(a.cTime))
  }

  async fetchBalance(): Promise<FuturesAccountsV2> {
    if (!this.client) return undefined

    try {
      const response = await this.client.getFuturesAccountAssets({
        productType: 'USDT-FUTURES',
      })

      const data = response.data.find((x) => x.marginCoin === 'USDT')
      return data
    } catch (error) {
      console.error('Error fetching balance:', error.body)
      return undefined
    }
  }

  async fetchContracts(): Promise<FuturesContractConfigV2[]> {
    const response = await this.client.getFuturesContractConfig({
      productType: 'USDT-FUTURES',
    })
    const contracts = response.data
    this.logger.debug(`[fetchContracts] Fetched contracts ${contracts.length}`)
    return contracts
  }

  async fetchPositions(): Promise<FuturesPositionV2[]> {
    const response = await this.client.getFuturesPositions({
      productType: 'USDT-FUTURES',
      marginCoin: 'USDT',
    })
    const positions = response.data
    this.logger.debug(`[fetchPositions] Fetched positions ${positions.length}`)
    // console.log(positions.filter((x) => x.symbol.includes('MAGIC')))
    return positions
  }

  async fetchKLines(symbol: string, period: Period): Promise<unknown[]> {
    return []
    // const API: BingXApiRequest = {
    //   path: "/openApi/swap/v3/quote/klines",
    //   method: "GET",
    //   payload: {
    //     symbol,
    //     interval: period,
    //     limit: "1000",
    //   },
    //   protocol: "https",
    // };
    // const klines = await this.bitgetRequest<KLine[]>(API);
    // this.logger.debug(
    //   `[fetchKlines][${symbol}][${period}] Fetched klines ${klines?.length ?? "ERROR"}`,
    // );
    // if (!klines) return [];

    // return klines;
  }

  async getWSListenKey(): Promise<string> {
    return ''
    //   const API: BingXApiRequest = {
    //     path: "/openApi/user/auth/userDataStream",
    //     method: "POST",
    //     payload: {},
    //     protocol: "https",
    //   };
    //   const listenKeyData = await this.bitgetRequest<ListenKey>(API);
    //   this.logger.debug(
    //     `[fetchBalance] Fetched getWSListenKey ${listenKeyData?.listenKey}`,
    //   );
    //   return listenKeyData.listenKey;
  }

  async extendWSListenKey(listenKey: string): Promise<void> {
    //   const API: BingXApiRequest = {
    //     path: "/openApi/user/auth/userDataStream",
    //     method: "PUT",
    //     payload: {
    //       listenKey,
    //     },
    //     protocol: "https",
    //   };
    //   await this.bitgetRequest<ListenKey>(API);
    //   this.logger.debug(`[fetchBalance] Extended listenKey`);
  }
}
