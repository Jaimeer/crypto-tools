import { defineStore } from 'pinia'
import { Trade } from '../../../server/data.dto'

type State = {
  trades: Trade[]
  loading: boolean
  error: string | null
}

export const useKucoinTradesStore = defineStore('kucoin-trades', {
  state: (): State => ({
    trades: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(trades: Trade[]) {
      this.trades = trades
    },
  },
})
