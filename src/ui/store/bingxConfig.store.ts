import { RemovableRef, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type State = {
  apiKey: RemovableRef<string>
  apiSecret: RemovableRef<string>
  _viewConfig: boolean
}

export const useBingXConfigStore = defineStore('bingx.config', {
  state: (): State => ({
    apiKey: useStorage('bingx.apiKey', ''),
    apiSecret: useStorage('bingx.apiSecret', ''),
    _viewConfig: false,
  }),

  getters: {
    viewConfig: state => state._viewConfig || !state.apiKey || !state.apiSecret,
  },

  actions: {
    setConfig(apiKey: string, apiSecret: string) {
      this.apiKey = apiKey
      this.apiSecret = apiSecret
    },
    toggleViewConfig() {
      this._viewConfig = !this._viewConfig
    },
  },
})
