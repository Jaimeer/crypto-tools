<script setup lang="ts">
import { computed, ref } from 'vue'
import { subDays, subHours, subWeeks } from 'date-fns'
import Table from '../general/Table.vue'
import Price from '../trading/Price.vue'
import Symbol from '../trading/Symbol.vue'
import {
  Trade,
  Balance,
  Bot,
  Contract,
  Position,
  Transaction,
} from '../../../server/data.dto'

const props = defineProps<{
  exchange: string
  trades: Trade[]
  positions: Position[]
  balance: Balance
  bots: Bot[]
  contracts: Contract[]
  transactions: Transaction[]
  hidedSymbols: string[]
  search: string
}>()

type RankingData = {
  profit4h: number
  profit24h: number
  profit1w: number
}

const transactions = computed(() => {
  return (
    props.transactions?.filter(
      (x) => x.symbol && !props.hidedSymbols.includes(x.symbol),
    ) ?? []
  )
})

const sortBy = ref<'4h' | '24h' | '1w'>('4h')

const symbolRanking = computed(() => {
  const now = new Date()
  const date4h = subHours(now, 4).getTime()
  const date24h = subDays(now, 1).getTime()
  const date1w = subWeeks(now, 1).getTime()
  const data = transactions.value.reduce(
    (acc, transaction) => {
      const symbol = transaction.symbol

      if (!acc[symbol]) {
        acc[symbol] = { profit4h: 0, profit24h: 0, profit1w: 0 }
      }

      if (transaction.time > date1w) acc[symbol].profit1w += transaction.income

      if (transaction.time > date24h)
        acc[symbol].profit24h += transaction.income

      if (transaction.time > date4h) acc[symbol].profit4h += transaction.income

      return acc
    },
    {} as Record<string, RankingData>,
  )

  // return array of objects sorted by value
  return Object.entries(data)
    .map(([key, value]) => ({ key, ...value }))
    .filter((items) =>
      items.key.toLowerCase().includes(props.search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy.value === '4h') return b.profit4h - a.profit4h
      if (sortBy.value === '24h') return b.profit24h - a.profit24h
      if (sortBy.value === '1w') return b.profit1w - a.profit1w
      return 0
    })
})
</script>

<template>
  <Table :headers="[]" :items="symbolRanking">
    <template #headers>
      <th class="px-2 py-0.5">Symbol</th>
      <th
        class="px-2 py-0.5"
        :class="{ 'cursor-pointer font-light': sortBy !== '4h' }"
        @click="sortBy = '4h'"
      >
        <span @click="sortBy = '4h'">P_4H</span>
      </th>
      <th
        class="px-2 py-0.5"
        :class="{ 'cursor-pointer font-light': sortBy !== '24h' }"
        @click="sortBy = '24h'"
      >
        <span @click="sortBy = '24h'">P_24H</span>
      </th>
      <th
        class="px-2 py-0.5"
        :class="{ 'cursor-pointer font-light': sortBy !== '1w' }"
        @click="sortBy = '1w'"
      >
        <span @click="sortBy = '1w'">P_1W</span>
      </th>
    </template>
    <template #default="{ item }">
      <td class="px-2 py-0.5">
        <Symbol
          :value="item.key"
          :exchange="exchange"
          :bots="bots"
          :trades="trades"
          :positions="positions"
          :balance="balance"
          :contracts="contracts"
        />
      </td>
      <td class="px-2 py-0.5">
        <Price :value="item.profit4h" :decimals="2" />
      </td>
      <td class="px-2 py-0.5">
        <Price :value="item.profit24h" :decimals="2" />
      </td>
      <td class="px-2 py-0.5">
        <Price :value="item.profit1w" :decimals="2" />
      </td>
    </template>
  </Table>
</template>
