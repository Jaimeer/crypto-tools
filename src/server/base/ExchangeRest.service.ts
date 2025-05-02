import { Period } from '../data.dto'

export abstract class ExchangeRestService<
  Transaction,
  Trade,
  Balance,
  Contract,
  Position,
  KLine,
> {
  abstract setCredentials(...args: string[]): void
  abstract fetchTransactions(
    currentTransactions: Transaction[],
  ): Promise<Transaction[]>
  abstract fetchTrades(currentTrades: Trade[]): Promise<Trade[]>
  abstract fetchBalance(): Promise<Balance>
  abstract fetchContracts(): Promise<Contract[]>
  abstract fetchPositions(): Promise<Position[]>
  abstract fetchKLines(symbol: string, period: Period): Promise<KLine[]>
  abstract getWSListenKey(): Promise<string>
  abstract extendWSListenKey(listenKey: string): Promise<void>
}
