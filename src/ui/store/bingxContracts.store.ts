import { defineStore } from "pinia";
import { Contract } from "../../server/BingX.dto";

type State = {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
};

export const useBingXContractsStore = defineStore("bingx.contracts", {
  state: (): State => ({
    contracts: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchContracts() {
      // this.loading = true;
      // this.error = null;
      // try {
      //   const data = await window.electronAPI.getBingXContracts();
      //   console.log("fetchContracts", { t: data });
      //   this.contracts = data;
      // } catch (error) {
      //   this.error = error.message || "Failed to fetch contracts";
      //   console.error("Error in store:", error);
      // } finally {
      //   this.loading = false;
      // }
    },
    processMessage(contracts: Contract[]) {
      this.contracts = contracts;
    },
  },
});
