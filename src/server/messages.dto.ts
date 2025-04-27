import {
  Balance,
  Bot,
  Contract,
  KLine,
  Period,
  Position,
  Trade,
  Transaction,
} from "./data.dto";

export type NotifyMessage =
  | { store: "bingx.trades"; trades: Trade[] }
  | { store: "bingx.transactions"; transactions: Transaction[] }
  | { store: "bingx.balance"; balance: Balance }
  | { store: "bingx.positions"; positions: Position[] }
  | { store: "bingx.contracts"; contracts: Contract[] }
  | { store: "bingx.klines"; symbol: string; period: Period; klines: KLine[] }
  | { store: "bitget.trades"; trades: Trade[] }
  | { store: "bitget.transactions"; transactions: Transaction[] }
  | { store: "bitget.balance"; balance: Balance }
  | { store: "bitget.positions"; positions: Position[] }
  | { store: "bitget.contracts"; contracts: Contract[] }
  | { store: "bitget.klines"; symbol: string; period: Period; klines: KLine[] }
  | { store: "bots"; bots: Bot[] };
