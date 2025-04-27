import { app } from "electron";
import fs from "fs/promises";
import path from "node:path";
import { CompressLib } from "../utils/CompressLib";

export interface CachedData<T> {
  lastUpdated: number;
  data: T[];
}

export class CacheService {
  private cacheDir: string;

  setHashCode(hashCode: string): void {
    this.cacheDir = path.join(app.getPath("userData"), "data-cache", hashCode);
    console.log("Cache dir: ", this.cacheDir);
    this.ensureCacheDirectory();
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create cache directory:", error);
    }
  }

  async writeCache<T>(fileName: string, data: CachedData<T>): Promise<void> {
    const filePath = path.join(this.cacheDir, fileName);
    try {
      await fs.writeFile(
        filePath,
        await CompressLib.compressString(JSON.stringify(data)),
        "utf8",
      );
      console.log(`Cache saved to ${filePath}`);
    } catch (error) {
      console.error(`Failed to write cache to ${filePath}:`, error);
    }
  }

  async readCache<T>(fileName: string): Promise<CachedData<T> | null> {
    const filePath = path.join(this.cacheDir, fileName);
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(
        await CompressLib.decompressString(data),
      ) as CachedData<T>;
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
