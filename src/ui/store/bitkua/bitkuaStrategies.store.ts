import { defineStore } from 'pinia'
import { Strategy } from '../../../server/data.dto'

type State = {
  strategies: Strategy[]
  loading: boolean
  error: string | null
}

export const useBitkuaStrategiesStore = defineStore('bitkua-strategies', {
  state: (): State => ({
    strategies: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(strategies: Strategy[]) {
      this.strategies = strategies
    },
  },
})
