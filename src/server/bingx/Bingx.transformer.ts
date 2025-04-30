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

export class BingxTransformer {
  private static parseSymbol(symbol: string) {
    return symbol.replace('-', '')
  }
  static transactionsTransform(
    transactions: BingxTransaction[],
  ): Transaction[] {
    return transactions.map((transaction) => ({
      symbol: this.parseSymbol(transaction.symbol),
      incomeType: transaction.incomeType,
      income: parseFloat(transaction.income),
      asset: transaction.asset,
      info: transaction.info,
      time: transaction.time,
      tranId: transaction.tranId,
      tradeId: transaction.tradeId,
    }))
  }

  static tradesTransform(trades: BingxTrade[]): Trade[] {
    return trades.map((trade) => ({
      symbol: this.parseSymbol(trade.symbol),
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
  }

  static balanceTransform(balance: BingxBalance): Balance {
    return {
      symbol: this.parseSymbol(balance.asset),
      availableMargin: balance.availableMargin,
      balance: balance.balance,
      equity: balance.equity,
      freezedMargin: balance.freezedMargin,
      realisedPnl: balance.realisedProfit,
      unrealizedPnl: balance.unrealizedProfit,
      usedMargin: balance.usedMargin,
    }
  }

  static positionsTransform(positions: BingxPosition[]): Position[] {
    return positions.map((position) => ({
      symbol: this.parseSymbol(position.symbol),
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
      updateTime: parseFloat(position.updateTime),
    }))
  }

  static contractsTransform(contracts: BingxContract[]): Contract[] {
    return contracts.map((contract) => ({
      contractId: contract.contractId,
      symbol: this.parseSymbol(contract.symbol),
      quantityPrecision: contract.quantityPrecision,
      pricePrecision: contract.pricePrecision,
      takerFeeRate: contract.takerFeeRate,
      makerFeeRate: contract.makerFeeRate,
      tradeMinQuantity: contract.tradeMinQuantity,
      tradeMinUSDT: contract.tradeMinUSDT,
      currency: contract.currency,
      asset: contract.asset,
      status: contract.status,
      apiStateOpen: contract.apiStateOpen,
      apiStateClose: contract.apiStateClose,
      ensureTrigger: contract.ensureTrigger,
      triggerFeeRate: contract.triggerFeeRate,
      brokerState: contract.brokerState,
      launchTime: contract.launchTime,
      maintainTime: contract.maintainTime,
      offTime: contract.offTime,
    }))
  }

  static klineTransform(klines: BingxKLine[]): KLine[] {
    return klines.map((kline) => ({
      open: parseFloat(kline.open),
      close: parseFloat(kline.close),
      high: parseFloat(kline.high),
      low: parseFloat(kline.low),
      volume: parseFloat(kline.volume),
      timestamp: kline.time,
    }))
  }

  static wsKlineTransform(klines: KLineDataEvent['data']): KLine[] {
    return klines.map((kline) => ({
      open: parseFloat(kline.o),
      close: parseFloat(kline.c),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      volume: parseFloat(kline.v),
      timestamp: kline.T,
    }))
  }
}
