import { RemovableRef, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type State = {
  apiKey: RemovableRef<string>
  apiSecret: RemovableRef<string>
  password: RemovableRef<string>
  _viewConfig: boolean
}

export const useKucoinConfigStore = defineStore('kucoin.config', {
  state: (): State => ({
    apiKey: useStorage('kucoin.apiKey', ''),
    apiSecret: useStorage('kucoin.apiSecret', ''),
    password: useStorage('kucoin.password', ''),
    _viewConfig: false,
  }),

  getters: {
    viewConfig: (state) =>
      state._viewConfig || !state.apiKey || !state.apiSecret || !state.password,
  },

  actions: {
    async setConfig(apiKey: string, apiSecret: string, password: string) {
      this.apiKey = apiKey
      this.apiSecret = apiSecret
      this.password = password
      await window.electronAPI.setKucoinCredentials(apiKey, apiSecret, password)
    },
    toggleViewConfig() {
      this._viewConfig = !this._viewConfig
    },
  },
})
