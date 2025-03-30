import { contextBridge, ipcRenderer } from 'electron'
import { Periods } from './server/Bingx.service'

contextBridge.exposeInMainWorld('electronAPI', {
  getBingXTransactions: async () => ipcRenderer.invoke('get-bingx-transactions'),
  getBingXTrades: async () => ipcRenderer.invoke('get-bingx-trades'),
  getBingXKLines: async (symbol: string, periods: Periods) =>
    ipcRenderer.invoke('get-bingx-klines', symbol, periods),
  getBingXBalance: async () => ipcRenderer.invoke('get-bingx-balance'),
  getBingXPositions: async () => ipcRenderer.invoke('get-bingx-positions'),
  setBingXCredentials: (apiKey: string, apiSecret: string) =>
    ipcRenderer.invoke('set-bingx-credentials', { apiKey, apiSecret }),
})
