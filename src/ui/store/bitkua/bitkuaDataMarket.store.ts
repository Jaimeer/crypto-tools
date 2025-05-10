import { defineStore } from 'pinia'
import { DataMarket } from '../../../server/data.dto'

type State = {
  dataMarket: DataMarket[]
  loading: boolean
  error: string | null
}

export const useBitkuaDataMarketStore = defineStore('bitkua-data-market', {
  state: (): State => ({
    dataMarket: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(dataMarket: DataMarket[]) {
      this.dataMarket = dataMarket
    },
  },
})
