import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getBingXTransactions: async () => ipcRenderer.invoke('get-bingx-transactions'),
  getBingXBalance: async () => ipcRenderer.invoke('get-bingx-balance'),
  setBingXCredentials: (apiKey: string, apiSecret: string) =>
    ipcRenderer.invoke('set-bingx-credentials', { apiKey, apiSecret }),
})
