import {
  Balance,
  Contract,
  KLine,
  Position,
  Trade,
  Transaction,
} from '../data.dto'

// we can not define abstract static class in typescript
export type ExchangeTransformer<
  ITransaction,
  ITrade,
  IBalance,
  IContract,
  IPosition,
  IKLine,
  IWsKline,
> = {
  transactionsTransform(transactions: ITransaction[]): Transaction[]
  tradesTransform(trades: ITrade[]): Trade[]
  balanceTransform(balance: IBalance): Balance
  contractsTransform(contracts: IContract[]): Contract[]
  positionsTransform(positions: IPosition[]): Position[]
  klineTransform(klines: IKLine[]): KLine[]
  wsKlineTransform(klines: IWsKline): KLine[]
}
