import { defineStore } from 'pinia'
import { Transaction } from '../../server/Bingx.service'

type State = {
  transactions: Transaction[]
  loading: boolean
  error: string | null
}

export const useBingXTransactionsStore = defineStore('bingx-transactions', {
  state: (): State => ({
    transactions: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchTransactions() {
      this.loading = true
      this.error = null

      try {
        const data = await window.electronAPI.getBingXTransactions()
        console.log('store', { t: data })
        this.transactions = data ?? []
      } catch (error) {
        this.error = error.message || 'Failed to fetch transactions'
        console.error('Error in store:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
