import { app } from 'electron'
import fs from 'fs/promises'
import path from 'node:path'
import { CompressLib } from '../utils/CompressLib'
import { LoggerService } from '../utils/Logger'

export interface CachedData<T> {
  lastUpdated: number
  data: T[]
}

export class CacheService {
  private cacheDir: string
  private readonly logger: LoggerService

  constructor() {
    this.logger = new LoggerService(CacheService.name)
  }

  setHashCode(hashCode: string): void {
    this.cacheDir = path.join(app.getPath('userData'), 'data-cache', hashCode)
    this.logger.debug(`Cache dir: ${this.cacheDir}`)
    this.ensureCacheDirectory()
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      this.logger.error(`Failed to create cache directory: ${error.message}`)
    }
  }

  async writeCache<T>(fileName: string, data: CachedData<T>): Promise<void> {
    const filePath = path.join(this.cacheDir, fileName)
    try {
      await fs.writeFile(
        filePath,
        await CompressLib.compressString(JSON.stringify(data)),
        'utf8',
      )
      this.logger.debug(`Cache saved to ${filePath}`)
    } catch (error) {
      this.logger.error(
        `Failed to write cache to ${filePath}: ${error.message}`,
      )
    }
  }

  async readCache<T>(fileName: string): Promise<CachedData<T> | null> {
    const filePath = path.join(this.cacheDir, fileName)
    try {
      const data = await fs.readFile(filePath, 'utf8')
      return JSON.parse(
        await CompressLib.decompressString(data),
      ) as CachedData<T>
    } catch (error) {
      // File doesn't exist or contains invalid JSON
      this.logger.debug(`No valid cache found at ${filePath}: ${error.message}`)
      return null
    }
  }

  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      await Promise.all(
        files.map((file) => fs.unlink(path.join(this.cacheDir, file))),
      )
      this.logger.debug('Cache cleared successfully')
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error.message}`)
    }
  }
}
