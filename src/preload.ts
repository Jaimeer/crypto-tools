import { contextBridge, ipcRenderer } from "electron";
import { NotifyMessage, Period } from "./server/BingX.dto";

contextBridge.exposeInMainWorld("electronAPI", {
  getBingXTransactions: async () =>
    ipcRenderer.invoke("get-bingx-transactions"),
  getBingXTrades: async () => ipcRenderer.invoke("get-bingx-trades"),
  getBingXKLines: async (symbol: string, period: Period) =>
    ipcRenderer.invoke("get-bingx-klines", symbol, period),
  getBingXBalance: async () => ipcRenderer.invoke("get-bingx-balance"),
  getBingXPositions: async () => ipcRenderer.invoke("get-bingx-positions"),
  setBingXCredentials: (apiKey: string, apiSecret: string) =>
    ipcRenderer.invoke("set-bingx-credentials", { apiKey, apiSecret }),

  onUpdateData: (callback: (message: NotifyMessage) => void) => {
    ipcRenderer.on("update-data", (event, data) => callback(data));
  },
});
