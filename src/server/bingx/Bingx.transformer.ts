import { ExchangeTransformer } from '../base/ExchangeTransformer.type'
import {
  Balance,
  Contract,
  KLine,
  Position,
  Trade,
  Transaction,
} from '../data.dto'
import {
  BingxBalance,
  BingxContract,
  BingxKLine,
  BingxPosition,
  BingxTrade,
  BingxTransaction,
} from './Bingx.dto'
import { KLineDataEvent } from './Bingx.ws.dto'

function parseSymbol(symbol: string) {
  return symbol.replace('-', '')
}

export const BingxTransformer: ExchangeTransformer<
  BingxTransaction,
  BingxTrade,
  BingxBalance,
  BingxContract,
  BingxPosition,
  BingxKLine,
  KLineDataEvent['data']
> = {
  transactionsTransform(transactions: BingxTransaction[]): Transaction[] {
    return transactions.map((transaction) => ({
      symbol: parseSymbol(transaction.symbol),
      incomeType: transaction.incomeType,
      income: parseFloat(transaction.income),
      asset: transaction.asset,
      info: transaction.info,
      time: transaction.time,
      tranId: transaction.tranId,
      tradeId: transaction.tradeId,
    }))
  },

  tradesTransform(trades: BingxTrade[]): Trade[] {
    return trades.map((trade) => ({
      symbol: parseSymbol(trade.symbol),
      qty: parseFloat(trade.qty),
      price: parseFloat(trade.price),
      quoteQty: parseFloat(trade.quoteQty),
      commission: parseFloat(trade.commission),
      commissionAsset: trade.commissionAsset,
      orderId: trade.orderId,
      tradeId: trade.tradeId,
      filledTime: trade.filledTime,
      side: trade.side,
      positionSide: trade.positionSide,
      role: trade.role,
      total: trade.total,
      realisedPNL: parseFloat(trade.realisedPNL),
    }))
  },

  balanceTransform(balance: BingxBalance): Balance {
    if (!balance)
      return {
        symbol: parseSymbol('unknown'),
        availableMargin: 0,
        balance: 0,
        equity: 0,
        freezedMargin: 0,
        realisedPnl: 0,
        unrealizedPnl: 0,
        usedMargin: 0,
      }
    return {
      symbol: parseSymbol(balance.asset),
      availableMargin: parseFloat(balance.availableMargin),
      balance: parseFloat(balance.balance),
      equity: parseFloat(balance.equity),
      freezedMargin: parseFloat(balance.freezedMargin),
      realisedPnl: parseFloat(balance.realisedProfit),
      unrealizedPnl: parseFloat(balance.unrealizedProfit),
      usedMargin: parseFloat(balance.usedMargin),
    }
  },

  positionsTransform(positions: BingxPosition[]): Position[] {
    if (!positions) return []
    return positions.map((position) => ({
      symbol: parseSymbol(position.symbol),
      positionId: position.positionId,
      positionSide: position.positionSide === 'LONG' ? 'LONG' : 'SHORT',
      isolated: position.isolated,
      positionAmt: parseFloat(position.positionAmt),
      availableAmt: parseFloat(position.availableAmt),
      unrealizedProfit: parseFloat(position.unrealizedProfit),
      realisedProfit: parseFloat(position.realisedProfit),
      initialMargin: parseFloat(position.initialMargin),
      margin: parseFloat(position.margin),
      avgPrice: parseFloat(position.avgPrice),
      liquidationPrice: position.liquidationPrice,
      leverage: parseFloat(position.leverage),
      positionValue: parseFloat(position.positionValue),
      markPrice: parseFloat(position.markPrice),
      riskRate: parseFloat(position.riskRate),
      maxMarginReduction: parseFloat(position.maxMarginReduction),
      pnlRatio: parseFloat(position.pnlRatio),
      createTime: parseFloat(position.createTime),
      updateTime: parseFloat(position.updateTime),
    }))
  },

  contractsTransform(contracts: BingxContract[]): Contract[] {
    const statusConfig = {
      '1': 'normal', //online,
      '25': 'restrictedAPI', // forbidden to open positions,
      '5': 'preOnline', // pre-online,
      '0': 'off', //' offline
      '-1': 'unknown',
    } as const

    type ContractStatus = (typeof statusConfig)[keyof typeof statusConfig]
    type Status = keyof typeof statusConfig

    return contracts.map((contract) => {
      const statusKey = contract.status.toString() as Status
      const status: ContractStatus = Object.keys(statusConfig).includes(
        statusKey,
      )
        ? (statusConfig[statusKey] as ContractStatus)
        : 'unknown'

      const item: Contract = {
        contractId: contract.contractId,
        symbol: parseSymbol(contract.symbol),
        quantityPrecision: contract.quantityPrecision,
        pricePrecision: contract.pricePrecision,
        takerFeeRate: contract.takerFeeRate,
        makerFeeRate: contract.makerFeeRate,
        tradeMinQuantity: contract.tradeMinQuantity,
        tradeMinUSDT: contract.tradeMinUSDT,
        currency: contract.currency,
        asset: contract.asset,
        status,
        apiStateOpen: contract.apiStateOpen === 'true',
        apiStateClose: contract.apiStateClose === 'true',
        ensureTrigger: contract.ensureTrigger,
        triggerFeeRate: parseFloat(contract.triggerFeeRate),
        brokerState: contract.brokerState,
        launchTime: contract.launchTime,
        maintainTime: contract.maintainTime,
        offTime: contract.offTime,
      }
      return item
    })
  },

  klineTransform(klines: BingxKLine[]): KLine[] {
    return klines.map((kline) => ({
      open: parseFloat(kline.open),
      close: parseFloat(kline.close),
      high: parseFloat(kline.high),
      low: parseFloat(kline.low),
      volume: parseFloat(kline.volume),
      timestamp: kline.time,
    }))
  },

  wsKlineTransform(klines: KLineDataEvent['data']): KLine[] {
    return klines.map((kline) => ({
      open: parseFloat(kline.o),
      close: parseFloat(kline.c),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      volume: parseFloat(kline.v),
      timestamp: kline.T,
    }))
  },
}
