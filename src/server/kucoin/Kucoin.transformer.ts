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
  KucoinBalance,
  KucoinContract,
  KucoinKLine,
  KucoinPosition,
  KucoinTrade,
  KucoinTransaction,
} from './Kucoin.dto'

function parseSymbol(symbol: string) {
  return symbol.replace('USDTM', '')
}

export const KucoinTransformer: ExchangeTransformer<
  KucoinTransaction,
  KucoinTrade,
  KucoinBalance,
  KucoinContract,
  KucoinPosition,
  unknown, //KucoinKLine
  unknown //KucoinWsKLine
> = {
  transactionsTransform(transactions: KucoinTransaction[]): Transaction[] {
    return transactions.map((transaction) => ({
      symbol: parseSymbol(transaction.symbol),
      incomeType: 'FUNDING_FEE', // Lo ponemos como tasas de financiación
      income: parseFloat(transaction.funding?.toString() ?? '0'),
      asset: transaction.settleCurrency ?? 'USDT',
      info: transaction.context ?? '',
      time: transaction.timePoint ?? 0,
      tranId: transaction.id?.toString() ?? '0',
      tradeId: '0', // No disponible en KucoinTransaction
    }))
  },

  tradesTransform(trades: KucoinTrade[]): Trade[] {
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

  balanceTransform(balance: KucoinBalance): Balance {
    return {
      symbol: parseSymbol(balance.currency),
      availableMargin: parseFloat(balance.availableBalance?.toString() ?? '0'),
      balance: parseFloat(balance.marginBalance?.toString() ?? '0'),
      equity: parseFloat(balance.accountEquity?.toString() ?? '0'),
      freezedMargin: parseFloat(balance.frozenFunds?.toString() ?? '0'),
      realisedPnl: 0, // No disponible en KucoinBalance
      unrealizedPnl: parseFloat(balance.unrealisedPNL?.toString() ?? '0'),
      usedMargin: parseFloat(((balance.positionMargin ?? 0) + (balance.orderMargin ?? 0)).toString()),
    }
  },

  positionsTransform(positions: KucoinPosition[]): Position[] {
    return positions.map((pos) => ({
      symbol: parseSymbol(pos.symbol),
      positionId: pos.id,
      positionSide: pos.currentQty >= 0 ? 'LONG' : 'SHORT', // Ignora pos.positionSide y crossMode, usando currentQty
      isolated: !pos.crossMode,
      positionAmt: parseFloat(pos.currentQty?.toString() ?? '0'),
      availableAmt: parseFloat(pos.currentQty?.toString() ?? '0'),
      unrealizedProfit: parseFloat(pos.unrealisedPnl?.toString() ?? '0'),
      realisedProfit: parseFloat(pos.realisedPnl?.toString() ?? '0'),
      initialMargin: parseFloat(pos.posInit?.toString() ?? '0'),
      margin: parseFloat(pos.posMargin?.toString() ?? '0'),
      avgPrice: parseFloat(pos.avgEntryPrice?.toString() ?? '0'),
      liquidationPrice: parseFloat(pos.liquidationPrice?.toString() ?? '0'),
      leverage: parseFloat(pos.leverage?.toString() ?? '0'),
      positionValue: parseFloat(pos.markValue?.toString() ?? '0'),
      markPrice: parseFloat(pos.markPrice?.toString() ?? '0'),
      riskRate: parseFloat(pos.delevPercentage?.toString() ?? '0'),
      maxMarginReduction: parseFloat('0'),
      pnlRatio: parseFloat(pos.unrealisedRoePcnt?.toString() ?? '0'),
      createTime: parseFloat(pos.openingTimestamp?.toString() ?? '0'),
      updateTime: parseFloat(pos.currentTimestamp?.toString() ?? '0'),
    }));
  },

  contractsTransform(contracts: KucoinContract[]): Contract[] {
    const statusConfig = {
      'Open': 'normal',
      'Paused': 'restrictedAPI',
      'CancelOnly': 'restrictedAPI',
      'Init': 'preOnline',
      'Closed': 'off',
      'Settled': 'off',
      'BeingSettled': 'unknown',
    } as const;

    type ContractStatus = (typeof statusConfig)[keyof typeof statusConfig];
    type Status = keyof typeof statusConfig;

    return contracts.map((contract) => {
      const statusKey = contract.status as Status;
      const status: ContractStatus = Object.keys(statusConfig).includes(statusKey)
        ? statusConfig[statusKey]
        : 'unknown';

      const item: Contract = {
        contractId: contract.symbol,
        symbol: parseSymbol(contract.symbol),
        quantityPrecision: parseFloat(contract.lotSize?.toString() ?? '0'),
        pricePrecision: parseFloat(contract.tickSize?.toString() ?? '0'),
        takerFeeRate: parseFloat(contract.takerFeeRate?.toString() ?? '0'),
        makerFeeRate: parseFloat(contract.makerFeeRate?.toString() ?? '0'),
        tradeMinQuantity: parseFloat(contract.lotSize?.toString() ?? '0'),
        tradeMinUSDT: parseFloat('0'),
        currency: contract.settleCurrency ?? 'USDT',
        asset: contract.settleCurrency ?? 'USDT',
        status,
        apiStateOpen: contract.status === 'Open',
        apiStateClose: contract.status === 'Open' || contract.status === 'CancelOnly',
        ensureTrigger: contract.isDeleverage ?? false,
        triggerFeeRate: parseFloat('0'),
        brokerState: contract.status === 'Open',
        launchTime: contract.firstOpenDate ?? 0,
        maintainTime: 0,
        offTime: contract.expireDate ?? 0,
      };
      return item
    })
  },

  klineTransform(klines: unknown[]): KLine[] {
    return []
  },
  wsKlineTransform(klines: unknown): KLine[] {
    return []
  },
}

