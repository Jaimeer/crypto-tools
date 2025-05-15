import { RemovableRef, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type State = {
  hidedSymbols: RemovableRef<string[]>
}

export const useKucoinPreferencesStore = defineStore('kucoin-preferences', {
  state: (): State => ({
    hidedSymbols: useStorage('kucoin.preferences.hidedSymbols', []),
  }),
})
