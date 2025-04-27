import { RemovableRef, useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

type State = {
  hidedSymbols: RemovableRef<string[]>;
};

export const useBitgetPreferencesStore = defineStore("preferences", {
  state: (): State => ({
    hidedSymbols: useStorage("bingx.preferences.hidedSymbols", []),
  }),
});
