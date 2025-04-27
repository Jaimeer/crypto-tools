<script setup lang="ts">
import { computed, ref } from "vue";
import { format } from "date-fns";
import { useBingXTransactionsStore } from "../../store/bingx/bingxTransactions.store";
import Price from "../Price.vue";
import Table from "../Table.vue";
import Symbol from "../Symbol.vue";
import DateTime from "../DateTime.vue";
import NumTrades from "../NumTrades.vue";
import {
  Balance,
  Bot,
  Contract,
  Position,
  Trade,
  Transaction,
} from "../../../server/data.dto";

const props = defineProps<{
  exchange: string;
  dateFormat: string;
  trades: Trade[];
  positions: Position[];
  balance: Balance;
  bots: Bot[];
  contracts: Contract[];
  transactions: Transaction[];
  allSymbols: string[];
  hidedSymbols: string[];
}>();

type PriceData = {
  num: number;
  pnl: number;
  all: number;
  charges: number;
  volume: number;
  transactions: Transaction[];
};

const transactions = computed(() => {
  return props.transactions?.filter((x) => x.symbol) ?? [];
});

const transactionsBySymbol = computed(() => {
  const data = transactions.value.reduce(
    (acc, transaction) => {
      const date = format(new Date(transaction.time), props.dateFormat);
      const symbol = transaction.symbol;
      if (!acc[date]) acc[date] = {};
      if (!acc[date][symbol])
        acc[date][symbol] = {
          num: 0,
          pnl: 0,
          all: 0,
          charges: 0,
          volume: 0,
          transactions: [],
        };
      if (transaction.incomeType === "REALIZED_PNL") {
        acc[date][symbol].num++;
        acc[date][symbol].pnl += parseFloat(transaction.income);
      } else {
        acc[date][symbol].charges += parseFloat(transaction.income);
      }
      acc[date][symbol].transactions.push(transaction);
      acc[date][symbol].all += parseFloat(transaction.income);
      return acc;
    },
    {} as Record<string, Record<string, PriceData>>,
  );

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({
      key,
      total: Object.values(value).reduce((acc, value) => {
        return acc + value.all;
      }, 0),
      num: Object.values(value).reduce((acc, value) => {
        return acc + value.num;
      }, 0),
      symbols: value,
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
});

const usedSymbols = computed(() => {
  return (
    props.allSymbols?.filter((x) => !props.hidedSymbols.includes(x)).sort() ??
    []
  );
});
</script>

<template>
  <Table :headers="[]" :items="transactionsBySymbol">
    <template #headers>
      <th class="px-2 py-0.5" v-for="header of ['date', 'total']">
        {{ header }}
      </th>
      <th
        class="px-2 py-0.5"
        v-for="header of usedSymbols.map((x) => x.replace('-USDT', ''))"
      >
        <Symbol
          :value="header"
          :exchange="exchange"
          :bots="bots"
          :trades="trades"
          :positions="positions"
          :balance="balance"
          :contracts="contracts"
        />
      </th>
    </template>
    <template #default="{ item }">
      <td class="px-2 py-0.5">{{ item.key }}</td>
      <td class="bg-slate-900 px-2 py-0.5">
        <Price :value="item.total" />
        <NumTrades :num="item.num" />
      </td>
      <td
        v-for="symbol in usedSymbols"
        :key="symbol"
        class="px-2 py-0.5 whitespace-nowrap"
      >
        <template v-if="item.symbols[symbol]">
          <VDropdown>
            <Price :value="item.symbols[symbol].all" />
            <NumTrades :num="item.symbols[symbol].num" />
            <span class="text-[10px] text-slate-600">
              {{ item.symbols[symbol].transactions.length }}
            </span>
            <template #popper>
              <div v-close-popper>
                <Table
                  :headers="['date', 'incomeType', 'income']"
                  :items="item.symbols[symbol].transactions"
                >
                  <template #default="{ item: transaction }">
                    <td class="px-2 py-0.5">
                      <DateTime :value="new Date(transaction.time)" />
                    </td>
                    <td class="px-2 py-0.5">{{ transaction.info }}</td>
                    <td class="px-2 py-0.5">
                      <Price :value="transaction.income" :decimals="2" />
                    </td>
                  </template>
                </Table>
              </div>
            </template>
          </VDropdown>
        </template>
        <template v-else> - </template>
      </td>
    </template>
  </Table>
</template>
