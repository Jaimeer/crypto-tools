import { FuturesAccountBillV2, FuturesOrderFillV2 } from "bitget-api";
import { CacheService } from "../Cache.service";

export interface CachedData<T> {
  lastUpdated: number;
  data: T[];
}

export class BitgetCacheService {
  private cacheService: CacheService;
  private transactionFileName: string;
  private tradeFileName: string;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
    this.transactionFileName = "bitget.transactions.json";
    this.tradeFileName = "bitget.trades.json";
  }

  setHashCode(hashCode: string): void {
    this.cacheService.setHashCode(hashCode);
  }

  async saveBitgetTransactions(
    transactions: FuturesAccountBillV2[],
  ): Promise<void> {
    const cachedData: CachedData<FuturesAccountBillV2> = {
      lastUpdated: Date.now(),
      data: transactions,
    };
    await this.cacheService.writeCache(this.transactionFileName, cachedData);
  }

  async loadBitgetTransactions(): Promise<CachedData<FuturesAccountBillV2> | null> {
    return this.cacheService.readCache<FuturesAccountBillV2>(
      this.transactionFileName,
    );
  }

  async saveBitgetTrades(trades: FuturesOrderFillV2[]): Promise<void> {
    const cachedData: CachedData<FuturesOrderFillV2> = {
      lastUpdated: Date.now(),
      data: trades,
    };
    await this.cacheService.writeCache(this.tradeFileName, cachedData);
  }

  async loadBitgetTrades(): Promise<CachedData<FuturesOrderFillV2> | null> {
    return this.cacheService.readCache<FuturesOrderFillV2>(this.tradeFileName);
  }
}
