import { defineStore } from "pinia";
import { Contract } from "../../../server/bitget/Bitget.dto";

type State = {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
};

export const useBitgetContractsStore = defineStore("bitget.contracts", {
  state: (): State => ({
    contracts: [],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(contracts: Contract[]) {
      this.contracts = contracts;
    },
  },
});
