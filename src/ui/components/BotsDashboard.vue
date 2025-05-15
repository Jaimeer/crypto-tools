<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBitkuaBotsStore } from '../store/bitkua/bitkuaBots.store'
import TheHeader from './general/TheHeader.vue'
import Table from './general/Table.vue'
import BotStatus from './bitkua/BotStatus.vue'
import BotSafe from './bitkua/BotSafe.vue'
import PositionSide from './trading/PositionSide.vue'
import BotStrategy from './bitkua/BotStrategy.vue'
import BotDelete from './bitkua/BotDelete.vue'
import BotReset from './bitkua/BotReset.vue'
import BotCreate from './bitkua/BotCreate.vue'
import DateTime from './general/DateTime.vue'
import { BitkuaActionUpdateSafe } from '../../server/bitkua/Bitkua.dto'
import { subDays } from 'date-fns'
import BotAmount from './bitkua/BotAmount.vue'
import { useBingxChartStore } from '../store/bingx/bingxChart.store'
import { Bot } from '../../server/data.dto'
import Exchange from './trading/Exchange.vue'
import { useBitgetChartStore } from '../store/bitget/bitgetChart.store'
import { useBitkuaDataMarketStore } from '../store/bitkua/bitkuaDataMarket.store'
import Fomo from './trading/Fomo.vue'
import Fud from './trading/Fud.vue'
import Price from './trading/Price.vue'

const bitkuaBotsStore = useBitkuaBotsStore()
const bingxChartStore = useBingxChartStore()
const bitgetChartStore = useBitgetChartStore()
const bitkuaDataMarketStore = useBitkuaDataMarketStore()

const search = ref('')
const bots = computed(() => {
  let index = 1
  return bitkuaBotsStore.bots
    .filter((bot) =>
      bot.symbol.toLowerCase().includes(search.value.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.exchange === b.exchange) return a.symbol.localeCompare(b.symbol)
      return a.exchange.localeCompare(b.exchange)
    })
    .map((bot) => ({
      index: index++,
      ...bot,
    }))
})

const activeSafeForAll = () => {
  bots.value.forEach((bot) => {
    if (!bot.safe) {
      const message: BitkuaActionUpdateSafe = {
        action: 'updateSafe',
        botId: bot.id,
        safe: true,
      }
      window.electronAPI.sendBitkuaAction(message)
    }
  })
}

const loadSymbolChart = (bot: Bot) => {
  switch (bot.exchange.toLowerCase()) {
    case 'bingx':
      bingxChartStore.setSymbol(bot.symbol)
      break
    case 'bitget':
      bitgetChartStore.setSymbol(bot.symbol)
      break
    default:
      console.log(
        `loadSymbolChart not implemented for this ${bot.exchange} exchange`,
      )
  }
}

const dateMarketValue = (symbol: string) => {
  return bitkuaDataMarketStore.dataMarket.find((x) => x.symbol === symbol)
}
</script>

<template>
  <div class="p-4">
    <TheHeader page="bots" v-model="search">
      <template #post-search>
        <div class="flex items-center gap-2">
          <div class="text-slate-400">
            <template v-if="bots.length !== bitkuaBotsStore.bots.length">
              {{ bots.length }}/{{ bitkuaBotsStore.bots.length }} bots
            </template>
            <template v-else> {{ bots.length }} bots </template>
          </div>
        </div>
      </template>
      <template #right>
        <div class="flex items-center gap-1">
          <div class="text-green-400">
            {{ bots.filter((x) => x.status === 'active').length }}
          </div>
          <div class="text-yellow-400">
            {{ bots.filter((x) => x.status === 'onlysell').length }}
          </div>
          <div class="text-red-400">
            {{ bots.filter((x) => x.status === 'stop').length }}
          </div>
        </div>
        <button
          @click="activeSafeForAll"
          class="rounded px-4 py-1 transition"
          :class="{
            'cursor-pointer bg-green-600 text-white': bots.filter(
              (x) => !x.safe,
            ).length,
            'bg-slate-700 text-slate-400':
              bots.filter((x) => !x.safe).length === 0,
          }"
          :disabled="bots.filter((x) => !x.safe).length === 0"
        >
          <span>Activate Safe ({{ bots.filter((x) => !x.safe).length }})</span>
        </button>
      </template>
    </TheHeader>
    <div class="my-4 w-full rounded border border-slate-600 p-2">
      <BotCreate />
    </div>
    <Table
      :headers="[
        'index',
        'exchange',
        'symbol',
        'positionSide',
        'amount',
        'count',
        'strategy',
        'status',
        'safe',
        'fomo',
        'fud',
        'price',
        'liq',
        'createdAt',
        'reset',
        'delete',
      ]"
      :items="bots"
      fullHeight
    >
      <template #default="{ item }">
        <td class="px-2 py-0.5">#{{ item.index }}</td>
        <td class="px-2 py-0.5">
          <Exchange :value="item.exchange" />
        </td>
        <td
          class="cursor-pointer px-2 py-0.5 text-[10px] font-bold"
          :class="{
            'bg-green-400 text-green-950 hover:bg-green-500':
              item.status === 'active',
            'bg-red-400 text-red-950 hover:bg-red-500': item.status === 'stop',
            'bg-yellow-400 text-yellow-950 hover:bg-yellow-500':
              item.status === 'onlysell',
          }"
          @click="loadSymbolChart(item)"
        >
          {{ item.symbol }}
        </td>
        <td class="px-2 py-0.5">
          <PositionSide :positionSide="item.positionSide as 'SHORT' | 'LONG'" />
        </td>
        <td class="flex px-2 py-0.5">
          <BotAmount :bot="item" />
        </td>
        <td class="px-2 py-0.5">
          <div
            class="w-fit rounded px-2 py-0.5 text-[10px]"
            :class="{
              'bg-slate-400 text-slate-950': item.count === 0,
              'bg-green-400 text-green-950': item.count > 0 && item.count < 7,
              'bg-yellow-400 text-yellow-950':
                item.count >= 7 && item.count < 12,
              'bg-red-400 text-red-950': item.count >= 12,
            }"
          >
            {{ item.count }}
          </div>
        </td>
        <td class="px-2 py-0.5">
          <BotStrategy :bot="item" />
        </td>
        <td class="px-2 py-0.5">
          <BotStatus :bot="item" />
        </td>
        <td class="px-2 py-0.5">
          <BotSafe :bot="item" />
        </td>
        <td class="px-2 py-0.5">
          <Fomo :value="dateMarketValue(item.symbol)?.fomo" />
        </td>
        <td class="px-2 py-0.5">
          <Fud :value="dateMarketValue(item.symbol)?.fud" />
          <!-- <pre>
            {{ dateMarketValue(item.symbol) }}
          </pre> -->
        </td>
        <td class="px-2 py-0.5">
          <Price :value="dateMarketValue(item.symbol)?.price" color="gray" />
        </td>
        <td class="px-2 py-0.5">
          <Price :value="dateMarketValue(item.symbol)?.liqMax" color="green" />
          -
          <Price :value="dateMarketValue(item.symbol)?.liqMin" color="red" />
        </td>

        <td class="flex items-center gap-1 px-2 py-0.5">
          <DateTime :value="item.createdAt" />
          <div
            v-if="subDays(new Date(), 1).getTime() < item.createdAt.getTime()"
            class="w-fit rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white"
          >
            NEW
          </div>
        </td>
        <td class="px-2 py-0.5">
          <BotReset :bot="item" />
        </td>
        <td class="px-2 py-0.5">
          <BotDelete :bot="item" />
        </td>
      </template>
    </Table>
  </div>
</template>
