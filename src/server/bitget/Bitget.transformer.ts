import { BingxBalance } from '../bingx/Bingx.dto'
import { Balance, Trade, Transaction } from '../data.dto'
import {
  FuturesAccountBillV2,
  FuturesAccountsV2,
  FuturesOrderFillV2,
} from 'bitget-api'

export class BitgetTransformer {
  private static parseSymbol(symbol: string) {
    return symbol.replace('-', '')
  }

  static transactionsTransform(
    transactions: FuturesAccountBillV2[],
  ): Transaction[] {
    return transactions.map((transaction) => ({
      symbol: this.parseSymbol(transaction.symbol),
      incomeType: transaction.businessType,
      income: parseFloat(transaction.amount) + parseFloat(transaction.fee),
      asset: transaction.coin,
      info: transaction.businessType,
      time: parseInt(transaction.cTime),
      tranId: transaction.billId,
      tradeId: transaction.billId,
    }))
  }

  static tradesTransform(trades: FuturesOrderFillV2[]): Trade[] {
    return trades.map((trade) => {
      return {
        symbol: this.parseSymbol(trade.symbol),
        qty: parseFloat('0'),
        price: parseFloat(trade.price),
        quoteQty: parseFloat(trade.quoteVolume),
        commission: 0,
        commissionAsset: '',
        orderId: trade.orderId,
        tradeId: trade.side === 'buy' ? 'LONG' : 'SHORT',
        filledTime: new Date(trade.cTime),
        side: trade.side.toUpperCase() as 'BUY' | 'SELL',
        positionSide: trade.side.toUpperCase(),
        role: trade.tradeScope.toUpperCase(),
        total: parseFloat(trade.quoteVolume),
        realisedPNL: parseFloat(trade.profit),
      }
    })
  }

  static balanceTransform(balance: FuturesAccountsV2): Balance {
    return {
      symbol: this.parseSymbol(balance.marginCoin),
      availableMargin: balance.crossedMaxAvailable,
      balance: balance.available + balance.locked,
      equity: balance.accountEquity,
      freezedMargin: balance.locked,
      realisedPnl: '0',
      unrealizedPnl: balance.unrealizedPL,
      usedMargin: balance.crossedMargin,
    }
  }
}
