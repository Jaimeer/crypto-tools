import { defineStore } from "pinia";
import { Trade } from "../../../server/bitget/Bitget.dto";

type State = {
  trades: Trade[];
  loading: boolean;
  error: string | null;
};

export const useBitgetTradesStore = defineStore("bitget-trades", {
  state: (): State => ({
    trades: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(trades: Trade[]) {
      this.trades = trades;
    },
  },
});
