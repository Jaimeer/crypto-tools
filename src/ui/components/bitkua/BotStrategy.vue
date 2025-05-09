<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  BitkuaActionUpdateStrategy,
  BotStrategiesAll,
} from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
}>()

const botStrategy = [
  'degen',
  'shortdegen',
  'aiexpertavgplus',
  'shortaiexpertavgplus',
  'infinity',
  'liquidationpoint',
  'shortliquidationpoint',
  'smartmoney',
  'shortsmartmoney',
  'sniperagresive',
  'shortsniperagresive',
  'pmd',
  'shortpmd',
  'lamilagrosa',
  'shortlamilagrosa',
  'ladominantkong',
  'shortladominantkong',
  'shortalashitcoin',
  'longalashitcoin',
  'aiexpertavg',
  'shortaiexpertavg',
  'liquiditypool',
  'shortliquiditypool',
  'karlosavg',
  'shortkarlosavg',
  'lamilagrosapro',
  'shortlamilagrosapro',
] as const

const isFormActive = ref(false)

const selectedStrategy = ref()

const sendAction = (botId: string, strategy: BotStrategiesAll) => {
  const message: BitkuaActionUpdateStrategy = {
    action: 'updateStrategy',
    botId,
    strategy,
  }
  window.electronAPI.sendBitkuaAction(message)
  deactivateForm()
}

const activateForm = () => {
  selectedStrategy.value = props.bot.strategy
  isFormActive.value = true
}

const deactivateForm = () => {
  selectedStrategy.value = ''
  isFormActive.value = false
}

const strategyName = (strategy: string) => {
  if (!strategy) return '---'
  return (
    {
      ladominantkong: 'Dominant Kong Infinity (Long)y F-∞',
      shortladominantkong: 'Dominant Kong (Short) F-12',
      shortalashitcoin: 'A La Shitcoin (Short) F-12',
      longalashitcoin: 'A La Shitcoin (Long) F-13',
      liquiditypool: 'Liquidity Pool (Long)F-120',
      shortliquiditypool: 'Liquidity Pool  (Short)F-120',
      aiexpertavg: 'AI Expert (Long) F-14',
      shortaiexpertavg: 'AI Expert (Short) F-12',
      aiexpertavgplus: 'AI Expert Plus (Long) F-15',
      shortaiexpertavgplus: 'AI Expert Plus (Short) F-15',
      lamilagrosa: 'La Milagrosa (Long) F-15',
      shortlamilagrosa: 'La Milagrosa (Short) F-15',
      lamilagrosapro: 'La Milagrosa Pro (Long) F-15',
      shortlamilagrosapro: 'La Milagrosa Pro (Short) F-15',
      pmd: 'PMD (Long) F-15',
      shortpmd: 'PMD (Short) F-15',
      degen: 'Degen (Long) F-15',
      shortdegen: 'Degen (Short) F-15',
      smartcandle: 'Smart Candle (Long) F-15',
      shortsmartcandle: 'Smart Candle (Short) F-15',
      infinity: 'Infinity(Long)  F-∞',
      liquidationpoint: 'Liquidation Point (Long) F-14',
      shortliquidationpoint: 'Liquidation Point (Short) F-14',
      smartmoney: 'Smart Money (Long) F-14',
      shortsmartmoney: 'Smart Money (Short) F-14',
      sniperagresive: 'Sniper Agresive (Long) F-14',
      shortsniperagresive: 'Sniper Agresive (Short) F-14',
      karlosavg: 'Karlos (Long) F-14',
    }[strategy] ?? strategy
  )
}

const strategyNameShort = (strategy: string) => {
  if (!strategy) return '---'
  return (
    {
      ladominantkong: 'DOM',
      shortladominantkong: 'DOM',
      shortalashitcoin: 'LSH',
      longalashitcoin: 'LSH',
      liquiditypool: 'LLP',
      shortliquiditypool: 'LLP',
      aiexpertavg: 'AIE',
      shortaiexpertavg: 'AIE',
      aiexpertavgplus: 'AIP',
      shortaiexpertavgplus: 'AIP',
      lamilagrosa: 'LMG',
      shortlamilagrosa: 'LMG',
      lamilagrosapro: 'LMP',
      shortlamilagrosapro: 'LMP',
      pmd: 'PMD',
      shortpmd: 'PMD',
      degen: 'DGN',
      shortdegen: 'DGN',
    }[strategy] ?? strategy
  )
}

watch(
  () => selectedStrategy.value,
  (newStrategy) => {
    if (newStrategy && newStrategy !== props.bot.strategy)
      sendAction(props.bot.id, newStrategy)
  },
)
</script>

<template>
  <div>
    <div
      v-if="!isFormActive"
      @click="activateForm"
      class="cursor-pointer hover:text-slate-500"
    >
      {{ strategyName(bot.strategy) }}
    </div>
    <div v-else class="flex items-center gap-2">
      <select
        v-model="selectedStrategy"
        class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
      >
        <option
          v-for="strategy in botStrategy.toSorted((a, b) =>
            strategyName(a).localeCompare(strategyName(b)),
          )"
          :key="strategyName(strategy)"
          :value="strategy"
          :selected="strategy === selectedStrategy"
        >
          {{ strategyName(strategy) }}
        </option>
      </select>
      <div class="cursor-pointer" @click="deactivateForm">X</div>
    </div>
  </div>
</template>
