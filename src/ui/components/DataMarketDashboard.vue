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
    .filter((dataMarket) => dataMarket.exchange === exchange.value)
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

const fomo = (item: DataMarket) => {
  return item.minD > 0 ? ((item.price - item.minD) / item.minD) * 100 : 0
}

const fud = (item: DataMarket) => {
  return item.maxD > 0 ? ((item.maxD - item.price) / item.maxD) * 100 : 0
}
</script>

<template>
  <div class="p-4">
    <TheHeader page="bots" v-model="search">
      <template #post-search> </template>
    </TheHeader>
    <Table
      :headers="[
        'index',
        'symbol',
        'exchange',
        'avarice',
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
      ]"
      :items="dataMarkets ?? []"
      fullHeight
    >
      <template #default="{ item }">
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
        <td class="px-2 py-0.5"><Fomo :value="fomo(item)" /></td>
        <td class="px-2 py-0.5"><Fud :value="fud(item)" /></td>
        <td class="px-2 py-0.5"><Price :value="item.price" color="gray" /></td>
        <td class="px-2 py-0.5"><Price :value="item.sma55" color="gray" /></td>
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
        <td class="px-2 py-0.5"><Price :value="item.liqMax" color="gray" /></td>
        <td class="px-2 py-0.5"><Price :value="item.liqMin" color="gray" /></td>
      </template>
    </Table>
    <BingxChartManager />
  </div>
</template>
