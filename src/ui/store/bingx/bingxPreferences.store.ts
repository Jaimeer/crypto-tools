import { RemovableRef, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type State = {
  hidedSymbols: RemovableRef<string[]>
}

export const useBingxPreferencesStore = defineStore('bingx-preferences', {
  state: (): State => ({
    hidedSymbols: useStorage('bingx.preferences.hidedSymbols', []),
  }),
})
