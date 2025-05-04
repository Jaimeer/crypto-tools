import { defineStore } from 'pinia'
import { KLine, Period } from '../../../server/data.dto'
import { useNow } from '@vueuse/core'

type State = {
  klines: Record<string, KLine[] | undefined>
  loading: boolean
  error: string | null
}

export const useBingxKLinesStore = defineStore('bingx-klines', {
  state: (): State => ({
    klines: {},
    loading: false,
    error: null,
  }),

  getters: {
    kLine: (state) => (symbol: string, period: Period) => {
      const key = `${symbol}-${period}`
      const symbolData = state.klines[key]
      return symbolData ?? []
    },
  },
  actions: {
    async fetchKLines(symbol: string, period: Period) {
      const key = `${symbol}-${period}`
      this.loading = true
      this.error = null
      this.klines[key] = undefined
      window.electronAPI.getBingXKLines(symbol, period)
      this.loading = false
    },

    async unsubscribeKLines(symbol: string, period: Period) {
      const key = `${symbol}-${period}`
      this.loading = true
      this.error = null
      this.klines[key] = undefined
      window.electronAPI.unsubscribeBingXKLines(symbol, period)
      this.loading = false
    },

    processMessage(symbol: string, period: Period, klines: KLine[]) {
      const key = `${symbol}-${period}`

      // console.log(this.klines)

      if (!this.klines[key] || this.klines[key].length === 0) {
        this.klines[key] = klines
        return
      }

      const newData = klines[0]
      const oldData = this.klines[key][0] as KLine
      // console.log({ newData, oldData, symbol, symbolState: this.klines[symbol] })
      if (oldData?.timestamp === newData?.timestamp) {
        oldData.close = newData.close
        oldData.high = newData.high
        oldData.low = newData.low
        oldData.open = newData.open
        oldData.volume = newData.volume
      } else {
        if (newData) this.klines[key].unshift(newData)
      }
    },
  },
})
