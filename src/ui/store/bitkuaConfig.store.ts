import { RemovableRef, useStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { BitkuaAction } from "../../server/Bitkua.dto";

type State = {
  email: RemovableRef<string>;
  password: RemovableRef<string>;
  secret: RemovableRef<string>;
};

export const useBitkuaConfigStore = defineStore("bitkua.config", {
  state: (): State => ({
    email: useStorage("bitkua.email", ""),
    password: useStorage("bitkua.password", ""),
    secret: useStorage("bitkua.secret", ""),
  }),

  getters: {},

  actions: {
    async setConfig(email: string, password: string, secret: string) {
      this.email = email;
      this.password = password;
      this.secret = secret;

      await window.electronAPI.setBitkuaCredentials(email, password, secret);
    },
    async sendAction(message: BitkuaAction) {
      await window.electronAPI.sendBitkuaAction(message);
    },
  },
});
