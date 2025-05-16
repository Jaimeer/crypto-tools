import { BingxTrade, BingxTransaction } from './Bingx.dto'
import { CacheService } from '../Cache.service'

export interface CachedData<T> {
  lastUpdated: number
  data: T[]
}

export class BingxCacheService {
  private cacheService: CacheService
  private transactionFileName: string
  private tradeFileName: string

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService
    this.transactionFileName = 'bingx.transactions.json'
    this.tradeFileName = 'bingx.trades.json'
  }

  setHashCode(hashCode: string): void {
    this.cacheService.setHashCode(hashCode)
  }

  async saveBingxTransactions(transactions: BingxTransaction[]): Promise<void> {
    const cachedData: CachedData<BingxTransaction> = {
      lastUpdated: Date.now(),
      data: transactions,
    }
    await this.cacheService.writeCache(this.transactionFileName, cachedData)
  }

  async loadBingxTransactions(): Promise<CachedData<BingxTransaction> | null> {
    let data = await this.cacheService.readCache<BingxTransaction>(
      this.transactionFileName,
    )
    if (!data) data = { data: [], lastUpdated: Date.now() }
    // Clean duplicates using a Set for O(1) lookups
    const uniqueKeys = new Set<string>()
    const dataWithoutDuplicates = data.data.filter((transaction) => {
      const key = `${transaction.tranId}-${transaction.tradeId}`
      if (uniqueKeys.has(key)) return false

      uniqueKeys.add(key)
      return true
    })

    return {
      ...data,
      data: dataWithoutDuplicates,
    }
  }

  async saveBingxTrades(trades: BingxTrade[]): Promise<void> {
    const cachedData: CachedData<BingxTrade> = {
      lastUpdated: Date.now(),
      data: trades,
    }
    await this.cacheService.writeCache(this.tradeFileName, cachedData)
  }

  async loadBingxTrades(): Promise<CachedData<BingxTrade> | null> {
    let data = await this.cacheService.readCache<BingxTrade>(this.tradeFileName)

    if (!data) data = { data: [], lastUpdated: Date.now() }
    // Clean duplicates
    const uniqueKeys = new Set<string>()
    const dataWithoutDuplicates = data.data.filter((transaction) => {
      const key = `${transaction.orderId}-${transaction.tradeId}`
      if (uniqueKeys.has(key)) return false

      uniqueKeys.add(key)
      return true
    })

    return {
      ...data,
      data: dataWithoutDuplicates,
    }
  }
}
