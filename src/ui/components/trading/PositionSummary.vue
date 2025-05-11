<script setup lang="ts">
import { computed } from 'vue'
import { Bot, Position } from '../../../server/data.dto'
import DateTime from '../general/DateTime.vue'
import Table from '../general/Table.vue'
import PositionSide from './PositionSide.vue'
import Price from './Price.vue'
import Strategy from './Strategy.vue'
import Rescue from './Rescue.vue'
import { Icon } from '@iconify/vue'
import { BitkuaActionUpdateStatus } from 'src/server/bitkua/Bitkua.dto'

const props = defineProps<{
  symbol: string
  positions: Position[]
  bots: Bot[]
}>()

const status = ['active', 'stop', 'onlysell'] as const

const bot = computed(() => {
  return {
    long: props.bots.find(
      (x) =>
        x.symbol.toLowerCase() === props.symbol.toLowerCase() &&
        !x.strategy.includes('short'),
    ),
    short: props.bots.find(
      (x) =>
        x.symbol.toLowerCase() === props.symbol.toLowerCase() &&
        x.strategy.includes('short'),
    ),
  }
})

const positionBot = (position: Position) => {
  const side = position.positionSide === 'LONG' ? 'long' : 'short'
  return bot.value[side]
}

const sendAction = (
  botId: string,
  status: 'active' | 'stop' | 'onlysell',
  amount?: number,
) => {
  const message: BitkuaActionUpdateStatus = {
    action: 'updateStatus',
    botId,
    status,
  }
  window.electronAPI.sendBitkuaAction(message)
}
</script>

<template>
  <div>
    <Table
      :headers="[
        'futures',
        'position/value',
        'unrealizedPNL(%)',
        'positionPnl',
        'avg. price',
        'mark/liq ',
        'created/updated',
        'bot',
        'bot actions',
        // 'warnings',
        'rescue',
      ]"
      :items="positions"
      :disable-sort="true"
    >
      <template #default="{ item }">
        <td class="px-2 py-0.5">
          <div>{{ item.symbol }}</div>
          <div class="flex items-center gap-1">
            <PositionSide :position-side="item.positionSide" />
            {{ item.isolated ? 'Isolated' : 'Cross' }}
            {{ item.leverage }}X
          </div>
        </td>
        <td class="px-2 py-0.5">
          <div>
            <Price :value="item.positionAmt" color="gray" />
            {{ item.symbol.replace('USDT', '') }}
          </div>
          <div>
            <Price :value="item.positionValue" color="gray" />
            USDT
          </div>
        </td>
        <td class="px-2 py-0.5">
          <div class="flex flex-col">
            <Price :value="item.unrealizedProfit" suffix=" USDT" />
            <Price
              :value="item.pnlRatio * 100"
              :decimals="2"
              prefix="( "
              suffix="% )"
            />
          </div>
        </td>
        <td class="px-2 py-0.5">
          <Price :value="item.realisedProfit" suffix=" USDT" />
        </td>
        <td class="px-2 py-0.5">
          <Price :value="item.avgPrice" color="gray" />
        </td>
        <td class="px-2 py-0.5">
          <div class="flex flex-col">
            <Price :value="item.markPrice" color="gray" />
            <Price :value="item.liquidationPrice" color="orange" />
          </div>
        </td>

        <td class="px-2 py-0.5">
          <div class="flex flex-col gap-1">
            <DateTime :value="new Date(item.createTime)" />
            <DateTime :value="new Date(item.updateTime)" />
          </div>
        </td>
        <td class="px-2 py-0.5">
          <div v-if="positionBot(item)" class="flex items-center gap-1">
            <div class="text-blue-400">[{{ positionBot(item)?.amount }}]</div>
            <div
              :class="{
                'text-slate-400': positionBot(item).count === 0,
                'text-lime-400':
                  positionBot(item).count > 0 && positionBot(item).count < 14,
                'text-red-400': positionBot(item).count >= 13,
              }"
            >
              [{{ positionBot(item).count }}]
            </div>
            <div class="text-slate-400">
              <Strategy :strategy="positionBot(item).strategy" />
            </div>
            <div class="py.0.5 rounded bg-green-500 px-2 text-white">
              {{ positionBot(item).safe ? 'safe' : '' }}
            </div>
          </div>
        </td>
        <td class="px-2 py-0.5">
          <div v-if="positionBot(item)" class="flex items-center gap-1">
            <button
              v-for="status in status"
              class="cursor-pointer rounded text-xs transition disabled:cursor-default"
              :class="{
                'px-1 text-green-600 hover:text-green-400 disabled:bg-green-900 disabled:text-green-200':
                  status === 'active',
                'px-1 text-red-600 hover:text-red-400 disabled:bg-red-900 disabled:text-red-200':
                  status === 'stop',
                'px-1 text-amber-600 hover:text-amber-400 disabled:bg-amber-900 disabled:text-amber-200':
                  status === 'onlysell',
              }"
              :disabled="positionBot(item).status === status"
              @click="sendAction(positionBot(item).id, status)"
            >
              {{ status.slice(0, 1).toUpperCase() }}
            </button>
          </div>
        </td>
        <!-- <td class="px-2 py-0.5">
          <div class="flex items-center gap-1">
            <Icon
              v-for="i in Math.floor(Math.abs(100 * item.pnlRatio) / 100)"
              :key="i"
              class="text-red-500"
              icon="ic:round-warning"
            />
            <Icon
              v-for="i in Math.floor(
                (Math.abs(100 * item.pnlRatio) % 100) / 10,
              )"
              :key="i"
              class="text-yellow-400"
              icon="ic:round-warning"
            />
          </div>
        </td> -->
        <td class="px-2 py-0.5">
          <Rescue
            v-if="item.unrealizedProfit < 0"
            :symbol="symbol"
            :side="item.positionSide === 'LONG' ? 'long' : 'short'"
            :allVisible="true"
            :gaps="[5, 10, 50]"
            :positions="positions"
          />
        </td>
      </template>
    </Table>
  </div>
</template>
