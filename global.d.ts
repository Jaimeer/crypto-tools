import { Balance, Transaction } from './src/server/Bingx.service'

interface ElectronAPI {
  getBingXTransactions: () => Promise<Transaction[]>
  getBingXBalance: () => Promise<Balance>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
