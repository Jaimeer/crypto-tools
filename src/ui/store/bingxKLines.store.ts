import { defineStore } from 'pinia'
import { KLine, Periods } from '../../server/Bingx.service'

type State = {
  klines: Record<string, { period: Periods; data: KLine[] }>
  loading: boolean
  error: string | null
}

export const useBingXKLinesStore = defineStore('bingx-klines', {
  state: (): State => ({
    klines: {},
    loading: false,
    error: null,
  }),

  getters: {
    kLine: state => (symbol: string, period: Periods) => {
      const symbolData = state.klines[symbol]
      if (!symbolData) return []
      if (period !== symbolData.period) return []
      return symbolData.data
    },
  },
  actions: {
    async fetchKLines(symbol: string, period: Periods) {
      this.loading = true
      this.error = null

      try {
        const data = await window.electronAPI.getBingXKLines(symbol, period)
        if (!this.klines[symbol]) {
          this.klines[symbol] = { period: period, data }
        } else {
          if (this.klines[symbol].period !== period) {
            this.klines[symbol].period = period
            this.klines[symbol].data = data
          }

          const newData = data[0]
          const oldData = this.klines[symbol].data[0]
          // console.log({ newData, oldData, symbol, symbolState: this.klines[symbol] })
          if (oldData.time === newData.time) {
            oldData.close = newData.close
            oldData.high = newData.high
            oldData.low = newData.low
            oldData.open = newData.open
            oldData.volume = newData.volume
          } else {
            this.klines[symbol].data.unshift(newData)
          }
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch klines'
        console.error('Error in store:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
