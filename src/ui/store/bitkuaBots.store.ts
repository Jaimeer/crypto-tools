import { defineStore } from "pinia";
import { Bot } from "../../server/BingX.dto";

type State = {
  bots: Bot[];
  loading: boolean;
  error: string | null;
};

export const useBitkuaBotsStore = defineStore("bitkua-bots", {
  state: (): State => ({
    bots: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(bots: Bot[]) {
      this.bots = bots;
    },
  },
});
