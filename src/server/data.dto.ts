export type Transaction = {
  symbol: string
  incomeType: string
  // | "TRANSFER"
  // | "REALIZED_PNL"
  // | "FUNDING_FEE"
  // | "TRADING_FEE"
  // | "INSURANCE_CLEAR"
  // | "TRIAL_FUND"
  // | "ADL"
  // | "SYSTEM_DEDUCTION"
  // | "GTD_PRICE";
  income: number
  asset: string
  info: string
  time: number
  tranId: string
  tradeId: string
}

export type Balance = {
  symbol: string
  balance: string
  equity: string
  unrealizedPnl: string
  realisedPnl: string
  availableMargin: string
  usedMargin: string
  freezedMargin: string
}

export type Trade = {
  symbol: string
  qty: number
  price: number
  quoteQty: number
  commission: number
  commissionAsset: string
  orderId: string
  tradeId: 'LONG' | 'SHORT'
  filledTime: Date
  side: 'BUY' | 'SELL'
  positionSide: string
  role: string
  total: number
  realisedPNL: number
}

export type Position = {
  symbol: string
  positionId: string | undefined
  positionSide: 'LONG' | 'SHORT'
  isolated: boolean
  positionAmt: number
  availableAmt: number
  unrealizedProfit: number
  realisedProfit: number
  initialMargin: number | undefined
  margin: number
  avgPrice: number
  liquidationPrice: number
  leverage: number
  positionValue: number | undefined
  markPrice: number
  riskRate: number | undefined
  maxMarginReduction: number | undefined
  pnlRatio: number | undefined
  createTime: number
  updateTime: number
}

export type KLine = {
  open: number
  close: number
  high: number
  low: number
  volume: number
  timestamp: number
}

export type Contract = {
  contractId: string
  symbol: string
  quantityPrecision: number
  pricePrecision: number
  takerFeeRate: number
  makerFeeRate: number
  tradeMinQuantity: number
  tradeMinUSDT: number
  currency: string
  asset: string
  status:
    | 'listed'
    | 'normal'
    | 'maintain'
    | 'limit_open'
    | 'restrictedAPI'
    | 'preOnline'
    | 'off'
    | 'unknown'
  apiStateOpen: boolean
  apiStateClose: boolean
  ensureTrigger: boolean
  triggerFeeRate: number
  brokerState: boolean
  launchTime: number | undefined
  maintainTime: number
  offTime: number
}

export type Period =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M'

export type ListenKey = {
  listenKey: string
}

export type BitkuaBot = {
  id: number
  symbol: string
  amount: number
  active: string
  exchange: string
  estrategia: string
  positionside: string
  username: string
  count: number
  created_at: Date
  safe: 'yes' | 'no'
}

export type Bot = {
  id: string
  symbol: string
  amount: number
  status: string
  exchange: string
  strategy: string
  positionSide: string
  count: number
  safe: boolean
  createdAt: Date
}
