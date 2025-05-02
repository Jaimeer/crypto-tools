import { defineStore } from 'pinia'

type State = {
  symbol: string
}

export const useBingxChartStore = defineStore('bingx.chart', {
  state: (): State => ({
    symbol: '',
  }),

  getters: {},

  actions: {
    async setSymbol(symbol: string) {
      this.symbol = symbol
    },
    async resetSymbol() {
      this.symbol = ''
    },
  },
})
