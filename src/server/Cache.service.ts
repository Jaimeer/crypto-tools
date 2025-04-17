import { app } from "electron";
import fs from "fs/promises";
import path from "path";
import { Trade, Transaction } from "./BingX.dto";

export interface CachedData<T> {
  lastUpdated: number;
  data: T[];
}

export class CacheService {
  private cacheDir: string;

  constructor() {
    // Use user data directory for persistent storage across app updates
    this.cacheDir = path.join(app.getPath("userData"), "data-cache");
    console.log("Cache dir: ", this.cacheDir);
    this.ensureCacheDirectory();
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log(
        "FOLDER Cache directory created or already exists:",
        this.cacheDir,
      );
    } catch (error) {
      console.error("Failed to create cache directory:", error);
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    const cachedData: CachedData<Transaction> = {
      lastUpdated: Date.now(),
      data: transactions,
    };

    const filePath = path.join(this.cacheDir, "transactions.json");
    await this.writeCache(filePath, cachedData);
  }

  async loadTransactions(): Promise<CachedData<Transaction> | null> {
    const filePath = path.join(this.cacheDir, "transactions.json");
    return this.readCache<Transaction>(filePath);
  }

  async saveTrades(trades: Trade[]): Promise<void> {
    const cachedData: CachedData<Trade> = {
      lastUpdated: Date.now(),
      data: trades,
    };

    const filePath = path.join(this.cacheDir, "trades.json");
    await this.writeCache(filePath, cachedData);
  }

  async loadTrades(): Promise<CachedData<Trade> | null> {
    const filePath = path.join(this.cacheDir, "trades.json");
    return this.readCache<Trade>(filePath);
  }

  private async writeCache<T>(
    filePath: string,
    data: CachedData<T>,
  ): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data), "utf8");
      console.log(`Cache saved to ${filePath}`);
    } catch (error) {
      console.error(`Failed to write cache to ${filePath}:`, error);
    }
  }

  private async readCache<T>(filePath: string): Promise<CachedData<T> | null> {
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data) as CachedData<T>;
    } catch (error) {
      // File doesn't exist or contains invalid JSON
      console.log(`No valid cache found at ${filePath}`);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map((file) => fs.unlink(path.join(this.cacheDir, file))),
      );
      console.log("Cache cleared successfully");
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }
}
