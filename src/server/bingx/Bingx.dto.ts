export type BingxTransaction = {
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

export type BingxBalance = {
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

export type BingxTrade = {
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

export type BingxPosition = {
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

export type BingxKLine = {
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  time: number;
};

export type BingxContract = {
  contractId: string;
  symbol: string;
  quantityPrecision: number;
  pricePrecision: number;
  takerFeeRate: number;
  makerFeeRate: number;
  tradeMinQuantity: number;
  tradeMinUSDT: number;
  currency: string;
  asset: string;
  status: number;
  apiStateOpen: string;
  apiStateClose: string;
  ensureTrigger: boolean;
  triggerFeeRate: string;
  brokerState: boolean;
  launchTime: number;
  maintainTime: number;
  offTime: number;
};

export type BingxPeriod =
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

export type BingxListenKey = {
  listenKey: string;
};
