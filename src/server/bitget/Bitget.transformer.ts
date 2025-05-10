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
  FuturesAccountBillV2,
  FuturesAccountsV2,
  FuturesContractConfigV2,
  FuturesOrderFillV2,
  FuturesPositionV2,
} from 'bitget-api'

function parseSymbol(symbol: string) {
  return symbol.replace('-', '')
}

export const BitgetTransformer: ExchangeTransformer<
  FuturesAccountBillV2,
  FuturesOrderFillV2,
  FuturesAccountsV2,
  FuturesContractConfigV2,
  FuturesPositionV2,
  unknown, //BitgetKLine
  unknown //BitgetWsKLine
> = {
  transactionsTransform(transactions: FuturesAccountBillV2[]): Transaction[] {
    return transactions.map((transaction) => ({
      symbol: parseSymbol(transaction.symbol),
      incomeType: transaction.businessType,
      income: parseFloat(transaction.amount) + parseFloat(transaction.fee),
      asset: transaction.coin,
      info: transaction.businessType,
      time: parseInt(transaction.cTime),
      tranId: transaction.billId,
      tradeId: transaction.billId,
    }))
  },

  tradesTransform(trades: FuturesOrderFillV2[]): Trade[] {
    return trades.map((trade) => {
      return {
        symbol: parseSymbol(trade.symbol),
        qty: parseFloat('0'),
        price: parseFloat(trade.price),
        quoteQty: parseFloat(trade.quoteVolume),
        commission: 0,
        commissionAsset: '',
        orderId: trade.orderId,
        tradeId: trade.tradeId,
        filledTime: new Date(trade.cTime),
        side: trade.side.toUpperCase() as 'BUY' | 'SELL',
        positionSide: trade.side.toUpperCase(),
        role: trade.tradeScope.toUpperCase(),
        total: parseFloat(trade.quoteVolume),
        realisedPNL: parseFloat(trade.profit),
      }
    })
  },

  balanceTransform(balance: FuturesAccountsV2): Balance {
    return {
      symbol: parseSymbol(balance.marginCoin),
      availableMargin: parseFloat(balance.crossedMaxAvailable),
      balance: parseFloat(balance.available) + parseFloat(balance.locked),
      equity: parseFloat(balance.accountEquity),
      freezedMargin: parseFloat(balance.locked),
      realisedPnl: 0,
      unrealizedPnl: parseFloat(balance.unrealizedPL),
      usedMargin: parseFloat(balance.crossedMargin),
    }
  },

  contractsTransform(contracts: FuturesContractConfigV2[]): Contract[] {
    const statusConfig = {
      listed: 'listed',
      normal: 'normal',
      maintain: 'maintain',
      limit_open: 'limit_open',
      restrictedAPI: 'restrictedAPI',
      preOnline: 'preOnline',
      off: 'off',
      unknown: 'unknown',
    } as const

    type Status = keyof typeof statusConfig

    return contracts.map((contract) => {
      const statusKey = contract.symbolStatus as string
      const status: Status = Object.keys(statusConfig).includes(statusKey)
        ? statusConfig[statusKey as Status]
        : 'unknown'

      const item: Contract = {
        contractId: contract.symbol,
        symbol: parseSymbol(contract.symbol),
        quantityPrecision: parseInt(contract.volumePlace),
        pricePrecision: parseInt(contract.pricePlace),
        takerFeeRate: parseFloat(contract.takerFeeRate),
        makerFeeRate: parseFloat(contract.makerFeeRate),
        tradeMinQuantity: parseFloat(contract.minTradeNum),
        tradeMinUSDT: parseFloat(contract.minTradeUSDT),
        currency: contract.quoteCoin,
        asset: contract.baseCoin,
        status,
        apiStateOpen: !['maintain', 'restrictedAPI', 'off'].includes(status),
        apiStateClose: !['maintain', 'restrictedAPI', 'off'].includes(status),
        ensureTrigger: true,
        triggerFeeRate: 0,
        brokerState: false,
        launchTime: undefined,
        maintainTime: parseInt(contract.maintainTime || '0'),
        offTime: parseInt(contract.offTime || '0'),
      }
      return item
    })
  },
  positionsTransform(positions: FuturesPositionV2[]): Position[] {
    return positions.map((position) => {
      const data: Position = {
        symbol: parseSymbol(position.symbol),
        positionId: undefined,
        positionSide: position.holdSide === 'short' ? 'SHORT' : 'LONG',
        isolated: position.marginMode === 'crossed' ? false : true,
        positionAmt: parseFloat(position.total),
        availableAmt: parseFloat(position.available),
        unrealizedProfit: parseFloat(position.unrealizedPL),
        realisedProfit: parseFloat(position.achievedProfits),
        initialMargin: undefined,
        margin: parseFloat(position.marginSize),
        avgPrice: parseFloat(position.openPriceAvg),
        liquidationPrice: parseFloat(position.liquidationPrice),
        leverage: parseFloat(position.leverage),
        positionValue: undefined,
        markPrice: parseFloat(position.markPrice),
        riskRate: undefined,
        maxMarginReduction: undefined,
        pnlRatio: undefined,
        createTime: parseInt(position.cTime),
        updateTime: parseInt(position.uTime),
      }
      return data
    })
  },
  klineTransform(klines: unknown[]): KLine[] {
    return []
  },
  wsKlineTransform(klines: unknown): KLine[] {
    return []
  },
}
