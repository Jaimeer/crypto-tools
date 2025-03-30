import { defineStore } from 'pinia'
import { Trade } from '../../server/Bingx.service'

type State = {
  trades: Trade[]
  loading: boolean
  error: string | null
}

export const useBingXTradesStore = defineStore('bingx-trades', {
  state: (): State => ({
    trades: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchTrades() {
      this.loading = true
      this.error = null

      try {
        const data = await window.electronAPI.getBingXTrades()
        console.log('fetchTrades', { t: data })
        this.trades = data ?? []
      } catch (error) {
        this.error = error.message || 'Failed to fetch trades'
        console.error('Error in store:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
