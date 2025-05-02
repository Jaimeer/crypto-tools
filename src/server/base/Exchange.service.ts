import { Period } from '../data.dto'

export abstract class ExchangeService {
  abstract setCredentials(...args: string[]): void
  abstract startAutoRefresh(intervalMs: number): void
  abstract stopWebSocket(): void
  abstract stopAutoRefresh(): void
  abstract loadSymbolKLines(symbol: string, period: Period): Promise<void>
  abstract removeSymbolKLines(symbol: string, period: Period): Promise<void>
}
