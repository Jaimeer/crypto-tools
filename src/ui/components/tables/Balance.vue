<script setup lang="ts">
import { computed } from "vue";
import { differenceInDays, startOfDay } from "date-fns";
import { Icon } from "@iconify/vue";
import { useBingXTransactionsStore } from "../../store/bingxTransactions.store";
import { useBingXBalanceStore } from "../../store/bingxBalance.store";
import Price from "../Price.vue";
import Table from "../Table.vue";
import { useBitkuaBotsStore } from "../../../ui/store/bitkuaBots.store";
import { useBingXPositionsStore } from "../../../ui/store/bingxPositions.store";

const bingXTransactionsStore = useBingXTransactionsStore();
const bingXBalanceStore = useBingXBalanceStore();
const bitkuaBotsStore = useBitkuaBotsStore();
const bingXPositionsStore = useBingXPositionsStore();

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

const riskRate = computed(() => {
  return parseFloat(bingXPositionsStore.positions[0]?.riskRate ?? "0") * 100;
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
  <Table :headers="['Key', 'Value']" :items="[]">
    <template #tbody>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">balance</td>
        <td class="px-2 py-0.5">
          <Price :value="balance?.balance" :decimals="2" />
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">riskRate</td>
        <td class="flex items-center gap-1 px-2 py-0.5">
          <span
            :class="{
              'text-green-400': riskRate < 1,
              'text-amber-400': riskRate > 1 && riskRate < 75,
              'text-red-400': riskRate > 75,
            }"
          >
            {{ riskRate.toFixed(2) }}%
          </span>
          <Icon
            v-if="riskRate > 1"
            class="text-yellow-400"
            icon="ic:round-warning"
          />
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">unrealizedProfit (bal vs eq)</td>
        <td class="px-2 py-0.5">
          <Price :value="balance?.unrealizedProfit" :decimals="2" />
          ({{
            (
              (-1 * parseFloat(balance?.unrealizedProfit) * 100) /
              parseFloat(balance?.balance)
            ).toFixed(2)
          }}%)
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">availableMargin (equity)</td>
        <td class="px-2 py-0.5">
          <Price :value="balance?.availableMargin" :decimals="2" />
          ({{
            (
              (parseFloat(balance?.availableMargin) * 100) /
              parseFloat(balance?.equity)
            ).toFixed(2)
          }}%)
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">usedMargin (equity)</td>
        <td class="px-2 py-0.5">
          <Price :value="balance?.usedMargin" color="orange" :decimals="2" />
          ({{
            (
              (parseFloat(balance?.usedMargin) * 100) /
              parseFloat(balance?.equity)
            ).toFixed(2)
          }}%)
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">profit</td>
        <td class="px-2 py-0.5">
          <Price
            v-if="balance"
            :value="parseFloat(balance?.balance) - totalIncomeTransactions"
            color="violet"
            :decimals="2"
          />
          <Price
            v-if="balance"
            class="text-[10px]"
            :value="
              parseFloat(balance?.balance) -
              totalIncomeTransactions +
              parseFloat(balance?.unrealizedProfit)
            "
            :decimals="2"
          />

          <Price
            v-if="balance"
            class="text-[8px]"
            :value="
              ((parseFloat(balance?.balance) -
                totalIncomeTransactions +
                parseFloat(balance?.unrealizedProfit)) *
                100) /
              (parseFloat(balance?.balance) - totalIncomeTransactions)
            "
            :decimals="2"
            suffix="%"
          />
        </td>
      </tr>
      <tr
        v-for="[key, value] in Object.entries({
          profitByDay: balance
            ? (parseFloat(balance?.balance) - totalIncomeTransactions) /
              differenceInDays(
                new Date(),
                startOfDay(
                  new Date(transactions[transactions.length - 1].time),
                ),
              )
            : '---',
          numDays: differenceInDays(
            new Date(),
            startOfDay(new Date(transactions[transactions.length - 1].time)),
          ),
          transfer: parseValue(totalIncomeTransactions),
          equity: balance?.equity,
          realisedProfit: balance?.realisedProfit,
          freezedMargin: balance?.freezedMargin,
        })"
        :key="key"
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">{{ key }}</td>
        <td class="px-2 py-0.5">
          <Price
            :value="value"
            :color="
              key === 'profitByDay'
                ? 'violet'
                : key === 'profit'
                  ? 'violet'
                  : undefined
            "
            :decimals="key === 'numDays' ? 0 : 2"
          />
        </td>
      </tr>

      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">DKBots - Num</td>
        <td class="flex gap-1 px-2 py-0.5">
          <span class="text-green-400">
            {{
              bitkuaBotsStore.bots.filter((x) => x.status === "active").length
            }}
          </span>
          <span class="text-amber-400">
            {{
              bitkuaBotsStore.bots.filter((x) => x.status === "onlysell").length
            }}
          </span>
          <span class="text-red-400">
            {{ bitkuaBotsStore.bots.filter((x) => x.status === "stop").length }}
          </span>
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">DKBots - Min Amount</td>
        <td class="flex gap-1 px-2 py-0.5">
          <Price
            :value="
              bitkuaBotsStore.bots.reduce((acc, bot) => {
                if (bot.status === 'stop') return acc;
                return acc + parseFloat(bot.amount);
              }, 0)
            "
            :decimals="2"
          />
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">DKBots - Amount invest</td>
        <td class="flex gap-1 px-2 py-0.5">
          <Price
            :value="
              bitkuaBotsStore.bots.reduce((acc, bot) => {
                return acc + parseFloat(bot.amount) * parseInt(bot.orders);
              }, 0)
            "
            prefix="~"
            :decimals="2"
          />
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">DKBots - Capital needed</td>
        <td class="flex gap-1 px-2 py-0.5">
          <Price
            :value="
              bitkuaBotsStore.bots.reduce((acc, bot) => {
                if (bot.status === 'stop') return acc;
                return acc + parseFloat(bot.amount);
              }, 0) * 10
            "
            prefix="~"
            :decimals="2"
          />
        </td>
      </tr>
      <tr
        class="border-b border-gray-200 bg-white hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
      >
        <td class="px-2 py-0.5">DKBots - If coverage (0.75)</td>
        <td class="flex items-center gap-1 px-2 py-0.5">
          <Price
            :value="
              bitkuaBotsStore.bots.reduce((acc, bot) => {
                if (bot.status === 'stop') return acc;
                return acc + parseFloat(bot.amount);
              }, 0) *
              10 *
              0.75
            "
            :color="
              bitkuaBotsStore.bots.reduce((acc, bot) => {
                if (bot.status === 'stop') return acc;
                return acc + parseFloat(bot.amount);
              }, 0) *
                10 *
                0.75 >
              parseFloat(balance?.balance ?? '0')
                ? 'red'
                : undefined
            "
            prefix="~"
            :decimals="2"
          />
          <Icon
            v-if="
              bitkuaBotsStore.bots.reduce((acc, bot) => {
                if (bot.status === 'stop') return acc;
                return acc + parseFloat(bot.amount);
              }, 0) *
                10 *
                0.75 >
              parseFloat(balance?.balance ?? '0')
            "
            class="text-yellow-400"
            icon="ic:round-warning"
          />
        </td>
      </tr>
    </template>
  </Table>
</template>
