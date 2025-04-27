import { RemovableRef, useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

type State = {
  apiKey: RemovableRef<string>;
  apiSecret: RemovableRef<string>;
  password: RemovableRef<string>;
  _viewConfig: boolean;
};

export const useBitgetConfigStore = defineStore("bitget.config", {
  state: (): State => ({
    apiKey: useStorage("bitget.apiKey", ""),
    apiSecret: useStorage("bitget.apiSecret", ""),
    password: useStorage("bitget.password", ""),
    _viewConfig: false,
  }),

  getters: {
    viewConfig: (state) =>
      state._viewConfig || !state.apiKey || !state.apiSecret,
  },

  actions: {
    async setConfig(apiKey: string, apiSecret: string, password: string) {
      this.apiKey = apiKey;
      this.apiSecret = apiSecret;
      this.password = password;
      await window.electronAPI.setBitgetCredentials(
        apiKey,
        apiSecret,
        password,
      );
    },
    toggleViewConfig() {
      this._viewConfig = !this._viewConfig;
    },
  },
});
