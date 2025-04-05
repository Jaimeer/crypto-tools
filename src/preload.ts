import { contextBridge, ipcRenderer } from "electron";
import { NotifyMessage, Period } from "./server/BingX.dto";
import { BitkuaAction } from "./server/Bitkua.dto";

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
  setBitkuaCredentials: (email: string, password: string, secret: string) =>
    ipcRenderer.invoke("set-bitkua-credentials", { email, password, secret }),
  sendBitkuaAction: (message: BitkuaAction) =>
    ipcRenderer.invoke("send-bitkua-action", message),
  onUpdateData: (callback: (message: NotifyMessage) => void) => {
    ipcRenderer.on("update-data", (event, data) => callback(data));
  },
  openChartsWindow: () => ipcRenderer.invoke("open-charts-window"),
});
