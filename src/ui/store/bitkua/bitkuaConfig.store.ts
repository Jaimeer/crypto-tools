import { RemovableRef, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { BitkuaAction } from '../../../server/bitkua/Bitkua.dto'

type State = {
  username: RemovableRef<string>
  token: RemovableRef<string>
}

export const useBitkuaConfigStore = defineStore('bitkua.config', {
  state: (): State => ({
    username: useStorage('bitkua.username', ''),
    token: useStorage('bitkua.token', ''),
  }),

  getters: {},

  actions: {
    async setConfig(username: string, token: string) {
      this.username = username
      this.token = token

      await window.electronAPI.setBitkuaCredentials(username, token)
    },
    async sendAction(message: BitkuaAction) {
      await window.electronAPI.sendBitkuaAction(message)
    },
  },
})
