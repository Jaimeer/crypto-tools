<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { Bot, Contract, Position } from '../../../server/data.dto'
import { useBingxChartStore } from '../../store/bingx/bingxChart.store'

const props = defineProps<{
  value: string
  exchange: string
  positions: Position[]
  bots: Bot[]
  contracts: Contract[]
  fullName?: boolean
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

const positionLong = computed(() => {
  return props.positions?.find(
    (x) => x.symbol === symbol.value && x.positionSide === 'LONG',
  )
})

const positionShort = computed(() => {
  return props.positions?.find(
    (x) => x.symbol === symbol.value && x.positionSide === 'SHORT',
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
          'text-slate-400/50':
            !botLong && !botShort && !positionLong && !positionShort,
          'text-yellow-400/50':
            !botLong && !botShort && (positionLong || positionShort),
          'text-red-400/50':
            botLong?.status === 'stop' && botShort?.status === 'stop',
        }"
      >
        {{ fullName ? value : value.replace('USDT', '') }}
      </span>
      <div class="relative">
        <Icon
          class="absolute -right-5 -bottom-1.5 text-xl"
          :class="{
            'text-slate-400/50': !botLong && !positionLong && !positionShort,
            'text-yellow-400': !botLong && positionLong,
            'text-green-400': botLong?.status === 'active',
            'text-orange-400': botLong?.status === 'onlysell',
            'text-red-400/50': botLong?.status === 'stop',
          }"
          icon="ic:baseline-arrow-drop-up"
        />
        <Icon
          class="absolute -top-1.5 -right-5 text-xl"
          :class="{
            'text-slate-400/50': !botLong && !positionLong && !positionShort,
            'text-yellow-400': !botShort && positionShort,
            'text-green-400': botShort?.status === 'active',
            'text-orange-400': botShort?.status === 'onlysell',
            'text-red-400/50': botShort?.status === 'stop',
          }"
          icon="ic:baseline-arrow-drop-down"
        />
      </div>
    </div>

    <span v-if="!contract" class="text-red-400">NC</span>
    <template v-else>
      <span v-if="!contract?.apiStateOpen" class="text-red-400"> open </span>
      <span v-if="!contract?.apiStateClose" class="text-red-400"> close </span>
    </template>
  </div>
</template>
