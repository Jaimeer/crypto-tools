export type Transaction = {
  symbol: string;
  incomeType:
    | "TRANSFER"
    | "REALIZED_PNL"
    | "FUNDING_FEE"
    | "TRADING_FEE"
    | "INSURANCE_CLEAR"
    | "TRIAL_FUND"
    | "ADL"
    | "SYSTEM_DEDUCTION"
    | "GTD_PRICE";
  income: string;
  asset: string;
  info: string;
  time: number;
  tranId: string;
  tradeId: string;
};

export type Balance = {
  code: number;
  msg: string;
  asset: string;
  balance: string;
  equity: string;
  unrealizedProfit: string;
  realisedProfit: string;
  availableMargin: string;
  usedMargin: string;
  freezedMargin: string;
  shortUid: string;
};

export type Trade = {
  symbol: string;
  qty: string;
  price: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  orderId: string;
  tradeId: "LONG" | "SHORT";
  filledTime: Date;
  side: "BUY" | "SELL";
  positionSide: string;
  role: string;
  total: number;
  realisedPNL: string;
};

export type Position = {
  symbol: string;
  positionId: string;
  positionSide: string;
  isolated: boolean;
  positionAmt: string;
  availableAmt: string;
  unrealizedProfit: string;
  realisedProfit: string;
  initialMargin: string;
  margin: string;
  avgPrice: string;
  liquidationPrice: number;
  leverage: string;
  positionValue: string;
  markPrice: string;
  riskRate: string;
  maxMarginReduction: string;
  pnlRatio: string;
  updateTime: string;
};

export type KLine = {
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  time: number;
};
export type Period =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export type ListenKey = {
  listenKey: string;
};

export type Bot = {
  id: string;
  orders: string;
  symbol: string;
  amount: string;
  strategy: string;
  status: string;
  delete: string;
  reset: string;
};

export type NotifyMessage =
  | { store: "trades"; trades: Trade[] }
  | { store: "transactions"; transactions: Transaction[] }
  | { store: "balance"; balance: Balance }
  | { store: "positions"; positions: Position[] }
  | { store: "klines"; symbol: string; period: Period; klines: KLine[] }
  | { store: "bots"; bots: Bot };
