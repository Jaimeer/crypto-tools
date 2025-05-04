import { defineStore } from 'pinia'
import { Transaction } from '../../../server/data.dto'

type State = {
  transactions: Transaction[]
  loading: boolean
  error: string | null
}

export const useBingxTransactionsStore = defineStore('bingx-transactions', {
  state: (): State => ({
    transactions: [],
    loading: false,
    error: null,
  }),

  getters: {
    allSymbols: (state) => {
      return [
        ...new Set(state.transactions.map((x) => x.symbol).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b))
    },
  },
  actions: {
    processMessage(transactions: Transaction[]) {
      this.transactions = transactions
    },
  },
})
