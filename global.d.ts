import { Balance, KLine, Transaction } from './src/server/Bingx.service'

interface ElectronAPI {
  getBingXTransactions: () => Promise<Transaction[]>
  getBingXTrades: () => Promise<Trade[]>
  getBingXKLines: (symbol: string, period: Periods) => Promise<KLine[]>
  getBingXBalance: () => Promise<Balance>
  getBingXPositions: () => Promise<Positions[]>
  setBingXCredentials: (apiKey: string, apiSecret: string) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
