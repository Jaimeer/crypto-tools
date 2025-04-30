import { defineStore } from 'pinia'
import { Balance } from '../../../server/data.dto'

type State = {
  balance: Balance | undefined
  loading: boolean
  error: string | null
}

export const useBitgetBalanceStore = defineStore('bitget.balance', {
  state: (): State => ({
    balance: undefined,
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(balance: Balance) {
      this.balance = balance
    },
  },
})
