export type ListenKeyExpiredEvent = {
  e: "listenKeyExpired";
  E: number;
  listenKey: string;
};

export type AccountBalanceAndPositionUpdateEvent = {
  m: "DEPOSIT" | "WITHDRAW" | "ORDER" | "FUNDING_FEE" | "SNAPSHOT";
  B: {
    a: string;
    wb: number;
    cw: number;
    bc: number;
  }[];
  P: {
    s: string;
    pa: number;
    ep: number;
    up: number;
    mt: number;
    iw: number;
    ps: number;
    cr: number;
  }[];
};

export type OrderUpdateEvent = {
  e: "TRADE_UPDATE" | "ORDER_TRADE_UPDATE";
  E: number;
  T: number;
  o: {
    s: string;
    c: string;
    i: number;
    S: "BUY" | "SELL";
    o:
      | "MARKET"
      | "TAKE_PROFIT_MARKET "
      | "STOP_MARKET "
      | "LIMIT  "
      | "TAKE_PROFIT"
      | "STOP "
      | "TRIGGER_MARKET"
      | "TRIGGER_LIMIT "
      | "TRAILING_STOP_MARKET "
      | "TRAILING_TP_SL"
      | "LIQUIDATION";
    q: string;
    p: string;
    sp: string;
    ap: string;
    x: "NEW" | "CANCELED" | "CALCULATED" | "EXPIRED" | "TRADE";
    X: "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "EXPIRED";
    N: string;
    n: string;
    T: number;
    wt: string;
    ps: "LONG" | "SHORT" | "BOTH";
    rp: string;
    z: string;
    sg: string;
    ti: number;
    ro: boolean;
    td: number;
    tv: string;
  };
};

export type ConfigurationUpdateEvent = {
  e: "ACCOUNT_CONFIG_UPDATE";
  E: number;
  ac: {
    s: string;
    l: number;
    S: number;
    mt: "cross" | "isolated";
  };
};

// Market Data

export type WebsocketMarketDataEvent = {
  code: number;
  dataType: string;
  data: unknown;
  asks: number;
  bids: number;
  P: number;
  v: number;
};

export type LatestTradeDetailEvent = {
  code: number;
  dataType: string;
  data: unknown;
  T: number;
  s: string;
  m: boolean;
  P: number;
  q: number;
};

export type KLineDataEvent = {
  code: number;
  dataType: string;
  s: string;
  data: {
    c: string;
    h: string;
    l: string;
    o: string;
    v: string;
    T: number;
  }[];
};

export type PriceChanges24HEvent = {
  code: string;
  dataType: string;
  data: string;
  e: string;
  E: string;
  s: string;
  p: string;
  P: string;
  o: string;
  h: string;
  l: string;
  L: string;
  c: string;
  v: string;
  q: string;
  O: string;
  C: string;
  B: string;
  b: string;
  A: string;
  a: string;
};

export type PriceChangesLatestEvent = {
  code: string;
  dataType: string;
  data: string;
  e: string;
  E: string;
  s: string;
  c: string;
};

export type PriceChangesLatestMarkEvent = {
  code: string;
  dataType: string;
  data: string;
  e: string;
  E: string;
  s: string;
  p: string;
};

export type BookTickerStreamsEvent = {
  code: string;
  dataType: string;
  data: string;
  e: string;
  u: string;
  E: string;
  T: string;
  s: string;
  b: string;
  B: string;
  a: string;
  A: string;
};

export type IncrementalDepthInformationEvent = {
  dataType: string;
  action: string;
  lastUpdateId: string;
  data: string;
  asks: string;
  bids: string;
};

export type MarketDataEvents =
  | WebsocketMarketDataEvent
  | LatestTradeDetailEvent
  | KLineDataEvent
  | PriceChanges24HEvent
  | PriceChangesLatestEvent
  | PriceChangesLatestMarkEvent
  | BookTickerStreamsEvent
  | IncrementalDepthInformationEvent;

export type AccountDataEvents =
  | ListenKeyExpiredEvent
  | AccountBalanceAndPositionUpdateEvent
  | OrderUpdateEvent
  | ConfigurationUpdateEvent;

export type WebSocketMessage = MarketDataEvents | AccountDataEvents;
