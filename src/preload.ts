import { contextBridge, ipcRenderer } from "electron";
import { Period } from "./server/data.dto";
import { BitkuaAction } from "./server/bitkua/Bitkua.dto";
import { NotifyMessage } from "./server/messages.dto";

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
  setBitgetCredentials: (apiKey: string, apiSecret: string, password: string) =>
    ipcRenderer.invoke("set-bitget-credentials", {
      apiKey,
      apiSecret,
      password,
    }),
  setBitkuaCredentials: (username: string, token: string) =>
    ipcRenderer.invoke("set-bitkua-credentials", { username, token }),
  sendBitkuaAction: (message: BitkuaAction) =>
    ipcRenderer.invoke("send-bitkua-action", message),
  onUpdateData: (callback: (message: NotifyMessage) => void) => {
    ipcRenderer.on("update-data", (event, data) => callback(data));
  },
  openChartsWindow: () => ipcRenderer.invoke("open-charts-window"),
});
