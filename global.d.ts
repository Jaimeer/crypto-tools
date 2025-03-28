import { Balance, Transaction } from './src/server/Bingx.service'

interface ElectronAPI {
  getBingXTransactions: () => Promise<Transaction[]>
  getBingXTrades: () => Promise<Trade[]>
  getBingXBalance: () => Promise<Balance>
  setBingXCredentials: (apiKey: string, apiSecret: string) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
