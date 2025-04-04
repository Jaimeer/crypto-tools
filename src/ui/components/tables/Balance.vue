<script setup lang="ts">
import { computed } from "vue";
import { differenceInDays, startOfDay } from "date-fns";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import { useBingXBalanceStore } from "../../store/bingxBalance.store";
import Price from "../Price.vue";
import Table from "../Table.vue";

const bingXTransactionsStore = useBingXTransactionsStore();
const bingXBalanceStore = useBingXBalanceStore();

const transactions = computed(() => {
  return bingXTransactionsStore.transactions.filter((x) => x.symbol);
});

const incomeTransactions = computed(() => {
  return bingXTransactionsStore.transactions.filter((x) => !x.symbol);
});

const totalIncomeTransactions = computed(() => {
  return incomeTransactions.value
    .map((x) => x.income)
    .reduce((acc, value) => {
      return acc + parseFloat(value);
    }, 0);
});

const balance = computed(() => {
  return bingXBalanceStore.balance;
});

const parseValue = (value: number | string | undefined) => {
  if (!value) return "---";
  if (typeof value === "string") return parseFloat(value).toFixed(4);
  return value.toFixed(4);
};
</script>

<template>
  <Table :headers="['Key', 'Value']" :items="[]" class="col-span-1">
    <template #tbody>
      <tr
        v-for="[key, value] in Object.entries({
          numDays: differenceInDays(
            new Date(),
            startOfDay(new Date(transactions[transactions.length - 1].time)),
          ),
          transfer: parseValue(totalIncomeTransactions),
          profit: balance
            ? parseFloat(balance.balance) - totalIncomeTransactions
            : '---',
          profitByDay: balance
            ? (parseFloat(balance.balance) - totalIncomeTransactions) /
              differenceInDays(
                new Date(),
                startOfDay(
                  new Date(transactions[transactions.length - 1].time),
                ),
              )
            : '---',
          balance: balance?.balance,
          equity: balance?.equity,
          unrealizedProfit: balance?.unrealizedProfit,
          realisedProfit: balance?.realisedProfit,
          availableMargin: balance?.availableMargin,
          usedMargin: balance?.usedMargin,
          freezedMargin: balance?.freezedMargin,
        })"
        :key="key"
        class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">{{ key }}</td>
        <td class="px-2 py-0.5">
          <Price
            :value="value"
            :color="
              key === 'profitByDay'
                ? 'violet'
                : key === 'profit'
                  ? 'orange'
                  : undefined
            "
          />
        </td>
      </tr>
    </template>
  </Table>
</template>
