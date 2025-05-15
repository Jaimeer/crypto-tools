import { defineStore } from 'pinia'
import { SecurityToken } from '../../../server/data.dto'

type State = {
  securityTokens: SecurityToken[]
  loading: boolean
  error: string | null
}

export const useBitkuaSecurityTokensStore = defineStore(
  'bitkua-security-tokens',
  {
    state: (): State => ({
      securityTokens: [],
      loading: false,
      error: null,
    }),

    actions: {
      processMessage(securityTokens: SecurityToken[]) {
        this.securityTokens = securityTokens
      },
    },
  },
)
