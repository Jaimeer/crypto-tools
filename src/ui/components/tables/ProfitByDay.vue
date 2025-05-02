<script setup lang="ts">
import { computed } from 'vue'
import { differenceInHours, format, startOfDay } from 'date-fns'
import Price from '../trading/Price.vue'
import Table from '../general/Table.vue'
import { Trade, Transaction } from '../../../server/data.dto'

const props = defineProps<{
  exchange: string
  trades: Trade[]
  transactions: Transaction[]
}>()

type PriceData = {
  num: number
  pnl: number
  all: number
  charges: number
  volume: number
}

const transactions = computed(() => {
  return props.transactions.filter((x) => x.symbol)
})

const trades = computed(() => {
  return props.trades
})

const transactionsByDay = computed(() => {
  const data = transactions.value.reduce(
    (acc, transaction) => {
      const date = format(new Date(transaction.time), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
      }
      if (
        ['REALIZED_PNL', 'close_long', 'close_short'].includes(
          transaction.incomeType,
        )
      ) {
        acc[date].num++
        acc[date].pnl += transaction.income
      } else {
        acc[date].charges += transaction.income
      }
      acc[date].all += transaction.income
      return acc
    },
    {} as Record<string, PriceData>,
  )

  trades.value.reduce((acc, trade) => {
    const date = format(new Date(trade.filledTime), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
    }
    if (trade.realisedPNL !== 0) return acc
    acc[date].volume += trade.quoteQty
    return acc
  }, data)

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.key.localeCompare(a.key))
})
</script>

<template>
  <Table
    :headers="[
      'Date',
      'num',
      'volume',
      'income',
      'charges',
      'profit',
      'prof%',
      'USDT/hour',
    ]"
    :items="transactionsByDay"
  >
    <template #default="{ item }">
      <td class="px-2 py-0.5">{{ item.key }}</td>
      <td class="px-2 py-0.5">{{ item.num }}</td>
      <td class="px-2 py-0.5">
        <Price :value="item.volume" color="orange" :decimals="2" />
      </td>
      <td class="px-2 py-0.5"><Price :value="item.pnl" :decimals="2" /></td>
      <td class="px-2 py-0.5">
        <Price :value="item.charges" :decimals="2" />
        <span class="text-[9px]">
          {{ ((Math.abs(item.charges) * 100) / item.pnl).toFixed(2) }}%
        </span>
      </td>
      <td class="px-2 py-0.5"><Price :value="item.all" :decimals="2" /></td>
      <td class="px-2 py-0.5">
        <template v-if="item.volume !== 0">
          {{ ((item.all * 100) / item.volume).toFixed(2) }}%
        </template>
        <template v-else> - </template>
      </td>
      <td class="px-2 py-0.5">
        <Price
          :value="
            item.all /
            (new Date(item.key).getTime() < startOfDay(new Date()).getTime()
              ? 24
              : differenceInHours(new Date(), startOfDay(new Date())))
          "
          color="violet"
          :decimals="2"
        />
      </td>
    </template>
  </Table>
</template>
