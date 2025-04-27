import { defineStore } from "pinia";
import { KLine, Period } from "../../../server/data.dto";

type State = {
  klines: Record<string, { period: Period; data: KLine[] }>;
  loading: boolean;
  error: string | null;
};

export const useBingXKLinesStore = defineStore("bingx-klines", {
  state: (): State => ({
    klines: {},
    loading: false,
    error: null,
  }),

  getters: {
    kLine: (state) => (symbol: string, period: Period) => {
      const symbolData = state.klines[symbol];
      if (!symbolData) return [];
      if (period !== symbolData.period) return [];
      return symbolData.data;
    },
  },
  actions: {
    async fetchKLines(symbol: string, period: Period) {
      this.loading = true;
      this.error = null;
      window.electronAPI.getBingXKLines(symbol, period);
      this.loading = false;
    },

    processMessage(symbol: string, period: Period, klines: KLine[]) {
      if (!this.klines[symbol]) {
        this.klines[symbol] = { period: period, data: klines };
      } else {
        if (this.klines[symbol].period !== period) {
          this.klines[symbol].period = period;
          this.klines[symbol].data = klines;
        }

        const newData = klines[0];
        const oldData = this.klines[symbol].data[0];
        // console.log({ newData, oldData, symbol, symbolState: this.klines[symbol] })
        if (oldData.time === newData.time) {
          oldData.close = newData.close;
          oldData.high = newData.high;
          oldData.low = newData.low;
          oldData.open = newData.open;
          oldData.volume = newData.volume;
        } else {
          this.klines[symbol].data.unshift(newData);
        }
      }
    },
  },
});
