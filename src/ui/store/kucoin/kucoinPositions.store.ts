import { defineStore } from 'pinia'
import { Position } from '../../../server/data.dto'

type State = {
  positions: Position[]
  loading: boolean
  error: string | null
}

export const useKucoinPositionsStore = defineStore('kucoin.positions', {
  state: (): State => ({
    positions: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(positions: Position[]) {
      this.positions = positions
    },
  },
})
