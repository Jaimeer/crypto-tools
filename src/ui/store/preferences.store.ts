import { RemovableRef, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type State = {
  hidedSymbols: RemovableRef<string[]>
}

export const usePreferencesStore = defineStore('preferences', {
  state: (): State => ({
    hidedSymbols: useStorage('preferences.hidedSymbols', []),
  }),
})
