import { KucoinTrade, KucoinTransaction } from './Kucoin.dto'
import { CacheService } from '../Cache.service'

export interface CachedData<T> {
  lastUpdated: number
  data: T[]
}

export class KucoinCacheService {
  private cacheService: CacheService
  private transactionFileName: string
  private tradeFileName: string

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService
    this.transactionFileName = 'kucoin.transactions.json'
    this.tradeFileName = 'kucoin.trades.json'
  }

  setHashCode(hashCode: string): void {
    this.cacheService.setHashCode(hashCode)
  }

  async saveKucoinTransactions(transactions: KucoinTransaction[]): Promise<void> {
    const cachedData: CachedData<KucoinTransaction> = {
      lastUpdated: Date.now(),
      data: transactions,
    }
    await this.cacheService.writeCache(this.transactionFileName, cachedData)
  }

  async loadKucoinTransactions(): Promise<CachedData<KucoinTransaction> | null> {
    const data = await this.cacheService.readCache<KucoinTransaction>(
      this.transactionFileName,
    )

    if (!data || !data.data) {
      return null
    }

    // Limpiar duplicados usando Set
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

  async saveKucoinTrades(trades: KucoinTrade[]): Promise<void> {
    const cachedData: CachedData<KucoinTrade> = {
      lastUpdated: Date.now(),
      data: trades,
    }
    await this.cacheService.writeCache(this.tradeFileName, cachedData)
  }

  async loadKucoinTrades(): Promise<CachedData<KucoinTrade> | null> {
    const data = await this.cacheService.readCache<KucoinTrade>(
      this.tradeFileName,
    )

    if (!data || !data.data) {
      return null
    }

    // Limpiar duplicados
    const uniqueKeys = new Set<string>()
    const dataWithoutDuplicates = data.data.filter((trade) => {
      const key = `${trade.orderId}-${trade.tradeId}`
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
