import { RemovableRef, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { BitkuaAction } from '../../../server/bitkua/Bitkua.dto'

type State = {
  username: RemovableRef<string>
  password: RemovableRef<string>
}

export const useBitkuaConfigStore = defineStore('bitkua.config', {
  state: (): State => ({
    username: useStorage('bitkua.username', ''),
    password: useStorage('bitkua.token', ''),
  }),

  getters: {},

  actions: {
    async setConfig(username: string, password: string) {
      this.username = username
      this.password = password

      await window.electronAPI.setBitkuaCredentials(username, password)
    },
    async sendAction(message: BitkuaAction) {
      await window.electronAPI.sendBitkuaAction(message)
    },
  },
})
