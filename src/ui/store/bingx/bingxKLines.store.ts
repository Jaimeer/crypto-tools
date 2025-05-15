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

      if (!this.klines[key] || this.klines[key].length === 0) {
        // Create a fresh reactive copy of the array
        this.klines[key] = [...klines]
        return
      }

      const newData = klines[0]
      if (!newData) return

      const oldData = this.klines[key][0] as KLine

      if (oldData?.timestamp === newData?.timestamp) {
        // Replace the first element with a new object instead of modifying properties
        const updatedKLines = [...this.klines[key]]
        updatedKLines[0] = {
          ...oldData,
          close: newData.close,
          high: newData.high,
          low: newData.low,
          open: newData.open,
          volume: newData.volume,
        }

        // Replace the entire array to ensure reactivity
        this.klines[key] = updatedKLines
      } else {
        if (newData) {
          // Add new data to beginning using a new array
          this.klines[key] = [newData, ...this.klines[key]]
        }
      }
    },
  },
})
