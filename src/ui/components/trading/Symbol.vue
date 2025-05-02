<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { Bot, Contract, Position, Trade } from '../../../server/data.dto'
import { useBingxChartStore } from '../../store/bingx/bingxChart.store'

const props = defineProps<{
  value: string
  exchange: string
  trades: Trade[]
  positions: Position[]
  bots: Bot[]
  contracts: Contract[]
}>()

const symbol = computed(() => {
  return props.value
})

const bingxChartStore = useBingxChartStore()

function loadSymbol() {
  bingxChartStore.setSymbol(symbol.value)
}

const botLong = computed(() => {
  return props.bots?.find(
    (x) => x.symbol === symbol.value && !x.strategy.includes('short'),
  )
})

const botShort = computed(() => {
  return props.bots?.find(
    (x) => x.symbol === symbol.value && x.strategy.includes('short'),
  )
})

const contract = computed(() => {
  return props.contracts?.find((x) => x.symbol === symbol.value)
})
</script>

<template>
  <div class="flex items-center gap-1">
    <div
      class="flex cursor-pointer items-center pr-4 underline decoration-dotted"
      @click="loadSymbol"
    >
      <span
        :class="{
          'text-slate-400/50': !botLong && !botShort,
          'text-red-400/50':
            botLong?.status === 'stop' && botShort?.status === 'stop',
        }"
      >
        {{ value.replace('USDT', '') }}
      </span>
      <div class="relative">
        <Icon
          class="absolute -right-5 -bottom-1.5 text-xl"
          :class="{
            'text-slate-400/50': !botLong,
            'text-green-400': botLong?.status === 'active',
            'text-orange-400': botLong?.status === 'onlysell',
            'text-red-400/50': botLong?.status === 'stop',
          }"
          icon="ic:baseline-arrow-drop-up"
        />
        <Icon
          class="absolute -top-1.5 -right-5 text-xl"
          :class="{
            'text-slate-400/50': !botShort,
            'text-green-400': botShort?.status === 'active',
            'text-orange-400': botShort?.status === 'onlysell',
            'text-red-400/50': botShort?.status === 'stop',
          }"
          icon="ic:baseline-arrow-drop-down"
        />
      </div>
    </div>

    <span v-if="!contract" class="text-red-400"> no contract </span>
    <template v-else>
      <span v-if="contract?.apiStateOpen === 'false'" class="text-red-400">
        open
      </span>
      <span v-if="contract?.apiStateClose === 'false'" class="text-red-400">
        close
      </span>
    </template>
  </div>
</template>
