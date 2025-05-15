import {
  Balance,
  Bot,
  Contract,
  DataMarket,
  KLine,
  Period,
  Position,
  SecurityToken,
  Strategy,
  Trade,
  Transaction,
  Notification,
} from './data.dto'

export type NotifyMessage =
  | { store: 'bingx.trades'; trades: Trade[] }
  | { store: 'bingx.transactions'; transactions: Transaction[] }
  | { store: 'bingx.balance'; balance: Balance }
  | { store: 'bingx.positions'; positions: Position[] }
  | { store: 'bingx.contracts'; contracts: Contract[] }
  | { store: 'bingx.klines'; symbol: string; period: Period; klines: KLine[] }
  | { store: 'bitget.trades'; trades: Trade[] }
  | { store: 'bitget.transactions'; transactions: Transaction[] }
  | { store: 'bitget.balance'; balance: Balance }
  | { store: 'bitget.positions'; positions: Position[] }
  | { store: 'bitget.contracts'; contracts: Contract[] }
  | { store: 'bitget.klines'; symbol: string; period: Period; klines: KLine[] }
  | { store: 'kucoin.trades'; trades: Trade[] }
  | { store: 'kucoin.transactions'; transactions: Transaction[] }
  | { store: 'kucoin.balance'; balance: Balance }
  | { store: 'kucoin.positions'; positions: Position[] }
  | { store: 'kucoin.contracts'; contracts: Contract[] }
  | { store: 'kucoin.klines'; symbol: string; period: Period; klines: KLine[] }
  | { store: 'bots'; bots: Bot[] }
  | { store: 'dataMarket'; dataMarket: DataMarket[] }
  | { store: 'securityTokens'; securityTokens: SecurityToken[] }
  | { store: 'strategies'; strategies: Strategy[] }
  | { store: 'notifications'; notification: Notification }
