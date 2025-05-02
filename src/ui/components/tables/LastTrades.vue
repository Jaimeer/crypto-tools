<script setup lang="ts">
import { computed } from 'vue'
import Price from '../trading/Price.vue'
import Table from '../general/Table.vue'
import Symbol from '../trading/Symbol.vue'
import DateTime from '../general/DateTime.vue'
import {
  Balance,
  Bot,
  Contract,
  Position,
  Trade,
  Transaction,
} from '../../../server/data.dto'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  exchange: string
  trades: Trade[]
  positions: Position[]
  balance: Balance
  bots: Bot[]
  contracts: Contract[]
  transactions: Transaction[]
  search: string
}>()

const transactions = computed(() => {
  return props.transactions.filter((x) => x.symbol)
})

const lastClosedTransactions = computed(() => {
  return transactions.value
    .filter((transaction) => {
      return ['REALIZED_PNL', 'close_long', 'close_short'].includes(
        transaction.incomeType,
      )
    })
    .filter((transaction) =>
      transaction.symbol.toLowerCase().includes(props.search.toLowerCase()),
    )
    .slice(0, 30)
})
</script>

<template>
  <Table :headers="['Date', 'symbol', 'pnl']" :items="lastClosedTransactions">
    <template #default="{ item }">
      <td class="px-2 py-0.5"><DateTime :value="new Date(item.time)" /></td>
      <td class="px-2 py-0.5">
        <Symbol
          :value="item.symbol"
          :exchange="exchange"
          :bots="bots"
          :trades="trades"
          :positions="positions"
          :balance="balance"
          :contracts="contracts"
        />
      </td>
      <td class="flex items-center px-2 py-0.5">
        <Price :value="item.income" :decimals="2" />
        <Icon
          v-if="item.info.startsWith('Sell')"
          icon="majesticons:arrow-up-line"
          class="text-green-400"
        />
        <Icon v-else icon="majesticons:arrow-down-line" class="text-red-400" />
      </td>
    </template>
  </Table>
</template>
