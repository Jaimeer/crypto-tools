//Tips KucoinTransaction
//The startAt and endAt range cannot exceed 3 months. An error will occur if the specified time window exceeds the range.
//If only startAt is entered, the default endAt is the current time. If it exceeds 3 months, an error will be reported.
//If only endAt is entered, the system will automatically calculate the start time as end time minus 3 months.
//Note: Because data changes frequently, using offset-based pagination instead of time-based pagination (startAt and endAt) 
// may lead to inaccurate or duplicated data. It is recommended to paginate using startAt and endAt for more reliable results. 
// It is recommended to paginate by startAt and endAt

//{symbol is required}
export type KucoinTransaction = {
  id: number;
  symbol: string;
  timePoint: number;
  fundingRate: number;
  markPrice: number;
  positionQty: number;
  positionCost: number;
  funding: number;
  settleCurrency: string;
  context: string;
  marginMode: 'ISOLATED' | 'CROSS';
}

// //{symbol is required}
// export type KuCoinTransaction = {
//   code: string;
//   data: {
//     hasMore: boolean;
//     dataList: KuCoinTransactionFeeRaw[];
//   };
// };

export type KucoinBalance = {
  code: string                //200000
  accountEquity: number       //1207.7482890871,
  unrealisedPNL: number       //-78.9422000026,
  marginBalance: number       //1286.6914268897,
  positionMargin: number      //43.8512076134,
  orderMargin: number         //4.05486,
  frozenFunds: number         //0,
  availableBalance: number    //1080.8772214711,
  currency: string            //"USDT",
  riskRatio: number           //0.0022211216,
  maxWithdrawAmount: number   //1080.8772214711
}

export type KucoinTrade = {
  symbol: string
  qty: string
  price: string
  quoteQty: string
  commission: string
  commissionAsset: string
  orderId: string
  tradeId: 'LONG' | 'SHORT'
  filledTime: Date
  side: 'BUY' | 'SELL'
  positionSide: string
  role: string
  total: number
  realisedPNL: string
}

export type KucoinPosition = {
  code: string                      // "200000",
  id: string                        // "500000000001046430",
  symbol: string                    //"ETHUSDM",
  crossMode: boolean                //true,
  delevPercentage: number           //0.71,
  openingTimestamp: number          //1730635780702,
  currentTimestamp: number          //1730636040926,
  currentQty: number                //1,
  currentCost: number               //-0.0004069805,
  currentComm: number               //2.441e-7,
  unrealisedCost: number            //-0.0004069805,
  realisedGrossCost: number         //0,
  realisedCost: number              //2.441e-7,
  isOpen: boolean                   //true,
  markPrice: number                 //2454.12,
  markValue: number                 //-0.000407478,
  posCost: number                   //-0.0004069805,
  posInit: number                   //0.0000406981,
  posMargin: number                 //0.0000407478,
  realisedGrossPnl: number          //0,
  realisedPnl: number               //-2.441e-7,
  unrealisedPnl: number             //-4.975e-7,
  unrealisedPnlPcnt: number         //-0.0012,
  unrealisedRoePcnt: number         //-0.0122,
  avgEntryPrice: number             //2457.12,
  liquidationPrice: number          //1429.96,
  bankruptPrice: number             //1414.96,
  settleCurrency: string            //"ETH",
  isInverse: boolean                //true,
  marginMode: 'CROSS' | 'ISOLATED'  //"CROSS",
  positionSide: 'BOTH' | 'BOTH'     //"BOTH",
  leverage: number                  //10,
}

export type KucoinContract = {
  symbol: string;
  rootSymbol: string;
  type: 'FFWCSX' | 'FFICSX'; // 'FFWCSX' Standard swap contracts, standard financial futures on swaps, expiration swap funding rate
  firstOpenDate: number;     // 'FFICSX' Futures Contract
  expireDate?: number; // Optional, null for non-expiring contracts
  settleDate?: number; // Optional, null if not supported
  baseCurrency: string;
  quoteCurrency: string;
  settleCurrency: string;
  maxOrderQty: number;
  maxPrice: number;
  lotSize: number;
  tickSize: number;
  indexPriceTickSize: number;
  multiplier: number;
  initialMargin: number;
  maintainMargin: number;
  maxRiskLimit: number;
  minRiskLimit: number;
  riskStep: number;
  makerFeeRate: number;
  takerFeeRate: number;
  takerFixFee: number; // Deprecated
  makerFixFee: number; // Deprecated
  settlementFee: number;
  isDeleverage: boolean;
  isQuanto: boolean; // Deprecated
  isInverse: boolean;
  markMethod: 'FairPrice';
  fairMethod: 'FundingRate' | null;
  fundingBaseSymbol: string;
  fundingQuoteSymbol: string;
  fundingRateSymbol: string;
  indexSymbol: string;
  settlementSymbol: string;
  status: 'Init' | 'Open' | 'BeingSettled' | 'Settled' | 'Paused' | 'Closed' | 'CancelOnly';
  fundingFeeRate: number;
  predictedFundingFeeRate: number;
  fundingRateGranularity: number;
  openInterest: string;
  turnoverOf24h: number;
  volumeOf24h: number;
  markPrice: number;
  indexPrice: number;
  lastTradePrice: number;
  nextFundingRateTime: number;
  maxLeverage: number;
  sourceExchanges: string[];
  premiumsSymbol1M: string;
  premiumsSymbol8H: string;
  fundingBaseSymbol1M: string;
  fundingQuoteSymbol1M: string;
  lowPrice: number;
  highPrice: number;
  priceChgPct: number;
  priceChg: number;
  k: number;
  m: number;
  f: number;
  mmrLimit: number;
  mmrLevConstant: number;
  supportCross: boolean;
  buyLimit: number;
  sellLimit: number;
}

//For each query, the system will return at most 500 pieces of data. To obtain more data, please page the data by time.
export type KucoinKLine = [
  number, // time
  number, // open
  number, // high
  number, // low
  number, // close
  number  // volume
]

export type KucoinKlineGranularity = 1 | 5 | 15 | 30 | 60 | 120 | 240 | 480 | 720 | 1440 | 10080

export type KucoinPeriod =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '8h'
  | '12h'
  | '1d'
  | '1w'

export type KucoinListenKey = {
  listenKey: string
}
