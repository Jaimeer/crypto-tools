import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getBingXTransactions: async () => ipcRenderer.invoke('get-bingx-transactions'),
  getBingXBalance: async () => ipcRenderer.invoke('get-bingx-balance'),
})
