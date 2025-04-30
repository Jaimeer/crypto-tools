import { defineStore } from 'pinia'
import { Contract } from '../../../server/data.dto'

type State = {
  contracts: Contract[]
  loading: boolean
  error: string | null
}

export const useBingxContractsStore = defineStore('bingx.contracts', {
  state: (): State => ({
    contracts: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(contracts: Contract[]) {
      this.contracts = contracts
    },
  },
})
