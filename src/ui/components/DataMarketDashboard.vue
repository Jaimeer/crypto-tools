<script setup lang="ts">
import { computed, ref } from 'vue'
import Table from './general/Table.vue'
import Symbol from './trading/Symbol.vue'
import Price from './trading/Price.vue'
import Exchange from './trading/Exchange.vue'
import Fomo from './trading/Fomo.vue'
import TheHeader from './general/TheHeader.vue'
import { useBitkuaDataMarketStore } from '../store/bitkua/bitkuaDataMarket.store'
import { useBingxBalanceStore } from '../store/bingx/bingxBalance.store'
import { useBingxContractsStore } from '../store/bingx/bingxContracts.store'
import { useBingxPositionsStore } from '../store/bingx/bingxPositions.store'
import { useBingxTradesStore } from '../store/bingx/bingxTrades.store'
import { useBitkuaBotsStore } from '../store/bitkua/bitkuaBots.store'
import BingxChartManager from './trading/BingxChartManager.vue'
import { DataMarket } from 'src/server/data.dto'
import Fud from './trading/Fud.vue'

const bitkuaDataMarketStore = useBitkuaDataMarketStore()
const bingxBalanceStore = useBingxBalanceStore()
const bitkuaBotsStore = useBitkuaBotsStore()
const bingxPositionsStore = useBingxPositionsStore()
const bingxTradesStore = useBingxTradesStore()
const bingxContractsStore = useBingxContractsStore()

const exchange = ref('Bingx')

const search = ref('')
const dataMarkets = computed(() => {
  let index = 1
  return bitkuaDataMarketStore.dataMarket
    .filter(
      (dataMarket) =>
        dataMarket.exchange === exchange.value &&
        dataMarket.symbol.toLowerCase().includes(search.value.toLowerCase()),
    )
    .sort((a, b) => {
      return a.symbol.localeCompare(b.symbol)
    })
    .map((dataMarket) => {
      return {
        index: index++,
        ...dataMarket,
      }
    })
})

const bots = computed(() => {
  return bitkuaBotsStore.bots.filter(
    (x) => x.exchange.toLowerCase() === exchange.value.toLowerCase(),
  )
})

const trades = computed(() => {
  return bingxTradesStore.trades
})

const balance = computed(() => {
  return bingxBalanceStore.balance
})

const positions = computed(() => {
  return bingxPositionsStore.positions
})

const contracts = computed(() => {
  return bingxContractsStore.contracts
})

const ranking = (data: DataMarket) => {
  if (data.fud < 0 || data.fomo < 0) return '---'
  const sma55_1d_plus_1_percent = data.sma55_1d * 1.05
  const sma55_1d_minus_1_percent = data.sma55_1d * 0.95
  const smaRange =
    data.price > sma55_1d_minus_1_percent &&
    data.price < sma55_1d_plus_1_percent

  if (data.sma55_1d > 0 && smaRange && data.fomo < 30) return 'LONG SMA'
  if (data.sma55_1d > 0 && smaRange && data.fud < 50) return 'SHORT SMA'
  if (data.fomo < 30 && data.fud > 70) return 'LONG'
  if (data.fomo > 200 && data.fud < 30) return 'SHORT'
  if (data.ratioFvdMc > 4 && data.fud > 0 && data.fud < 50) return 'SHORT PVD'
  return '---'
}
</script>

<template>
  <div class="p-4">
    <TheHeader page="data-market" v-model="search">
      <template #post-search> </template>
    </TheHeader>
    <Table
      :headers="[
        'index',
        'symbol',
        'exchange',
        'signal',
        'fomo',
        'fud',
        'price',
        'sma55',
        'sma55_1d',
        'maxD',
        'minD',
        'pmd',
        'max15_1h',
        'min15_1h',
        'higherRange',
        'lowerRange',
        'liqMax',
        'liqMin',
        'ratioFvdMc',
      ]"
      :items="dataMarkets"
      fullHeight
    >
      <template #tbody="{ items }">
        <tr
          v-for="item in items"
          class="border-b border-gray-200 bg-white text-nowrap hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
        >
          <td class="px-2 py-0.5">#{{ item.index }}</td>
          <td class="px-2 py-0.5">
            <Symbol
              :value="item.symbol"
              :exchange="item.exchange"
              :bots="bots"
              :trades="trades"
              :positions="positions"
              :balance="balance"
              :contracts="contracts"
            />
          </td>
          <td class="px-2 py-0.5"><Exchange :value="item.exchange" /></td>
          <td class="px-2 py-0.5">
            {{ ranking(item) }}
          </td>
          <td class="px-2 py-0.5"><Fomo :value="item.fomo" /></td>
          <td class="px-2 py-0.5"><Fud :value="item.fud" /></td>
          <td class="px-2 py-0.5">
            <Price :value="item.price" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price :value="item.sma55" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price :value="item.sma55_1d" color="gray" />
          </td>
          <td class="px-2 py-0.5"><Price :value="item.maxD" color="gray" /></td>
          <td class="px-2 py-0.5"><Price :value="item.minD" color="gray" /></td>
          <td class="px-2 py-0.5"><Price :value="item.pmd" color="gray" /></td>
          <td class="px-2 py-0.5">
            <Price :value="item.max15_1h" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price :value="item.min15_1h" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price :value="item.higherRange" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price :value="item.lowerRange" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price :value="item.liqMax" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price :value="item.liqMin" color="gray" />
          </td>
          <td class="px-2 py-0.5">
            <Price
              :value="item.ratioFvdMc"
              color="gray"
              :decimals="2"
              suffix="x"
            />
          </td>
        </tr>
      </template>
    </Table>
    <BingxChartManager />
  </div>
</template>
