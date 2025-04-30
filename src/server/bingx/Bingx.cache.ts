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
    return this.cacheService.readCache<BingxTransaction>(
      this.transactionFileName,
    )
  }

  async saveBingxTrades(trades: BingxTrade[]): Promise<void> {
    const cachedData: CachedData<BingxTrade> = {
      lastUpdated: Date.now(),
      data: trades,
    }
    await this.cacheService.writeCache(this.tradeFileName, cachedData)
  }

  async loadBingxTrades(): Promise<CachedData<BingxTrade> | null> {
    return this.cacheService.readCache<BingxTrade>(this.tradeFileName)
  }
}
