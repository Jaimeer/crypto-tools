import { defineStore } from "pinia";
import { Balance } from "../../server/BingX.dto";

type State = {
  balance: Balance | undefined;
  loading: boolean;
  error: string | null;
};

export const useBingXBalanceStore = defineStore("bingx.balance", {
  state: (): State => ({
    balance: undefined,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchBalance() {
      // this.loading = true;
      // this.error = null;
      // try {
      //   const data = await window.electronAPI.getBingXBalance();
      //   console.log("fetchBalance", { t: data });
      //   this.balance = data;
      // } catch (error) {
      //   this.error = error.message || "Failed to fetch balance";
      //   console.error("Error in store:", error);
      // } finally {
      //   this.loading = false;
      // }
    },
    processMessage(balance: Balance) {
      this.balance = balance;
    },
  },
});
