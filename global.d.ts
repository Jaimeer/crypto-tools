import { Balance, KLine, Transaction } from "./src/server/Bingx.service";
import { BitkuaAction } from "./src/server/Bitkua.service";

interface ElectronAPI {
  getBingXTransactions: () => Promise<Transaction[]>;
  getBingXTrades: () => Promise<Trade[]>;
  getBingXKLines: (symbol: string, period: Periods) => Promise<KLine[]>;
  getBingXBalance: () => Promise<Balance>;
  getBingXPositions: () => Promise<Positions[]>;
  setBingXCredentials: (
    apiKey: string,
    apiSecret: string,
  ) => Promise<{ success: boolean }>;
  setBitkuaCredentials: (
    email: string,
    password: string,
    secret: string,
  ) => Promise<{ success: boolean }>;
  sendBitkuaAction: (message: BitkuaAction) => Promise<{ success: boolean }>;

  onUpdateData: (callback: (message: NotifyMessage) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
