import { RemovableRef, useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

type State = {
  hidedSymbols: RemovableRef<string[]>;
  hideTrades: RemovableRef<boolean>;
};

export const usePreferencesStore = defineStore("preferences", {
  state: (): State => ({
    hidedSymbols: useStorage("preferences.hidedSymbols", []),
    hideTrades: useStorage("preferences.hideTrades", false),
  }),
  actions: {
    toggleHideTrades() {
      this.hideTrades = !this.hideTrades;
    },
  },
});
