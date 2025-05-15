import { Balance, KLine, Transaction } from './src/server/bingx/Bingx.service'
import { BitkuaAction } from './src/server/bitkua/Bitkua.service'

interface ElectronAPI {
  getBingXTransactions: () => Promise<Transaction[]>
  getBingXTrades: () => Promise<Trade[]>
  getBingXKLines: (symbol: string, period: Periods) => Promise<KLine[]>
  unsubscribeBingXKLines: (symbol: string, period: Periods) => Promise<void>
  getBingXBalance: () => Promise<Balance>
  getBingXPositions: () => Promise<Positions[]>
  setBingXCredentials: (
    apiKey: string,
    apiSecret: string,
  ) => Promise<{ success: boolean }>
  setBitgetCredentials: (
    apiKey: string,
    apiSecret: string,
    password: string,
  ) => Promise<{ success: boolean }>
  setKucoinCredentials: (
    apiKey: string,
    apiSecret: string,
    password: string,
  ) => Promise<{ success: boolean }>
  setBitkuaCredentials: (
    username: string,
    token: string,
  ) => Promise<{ success: boolean }>
  sendBitkuaAction: (message: BitkuaAction) => Promise<{ success: boolean }>

  onUpdateData: (callback: (message: NotifyMessage) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export { }
