<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BitkuaActionUpdateStrategy,
  BotStrategiesAll,
} from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'
import { useBitkuaStrategiesStore } from '../../store/bitkua/bitkuaStrategies.store'
import Strategy from '../trading/Strategy.vue'

const bitkuaStrategiesStore = useBitkuaStrategiesStore()

const props = defineProps<{
  bot: Bot
}>()

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

const strategies = computed(() => {
  return bitkuaStrategiesStore.strategies
    .map((x) => ({
      name: x.name,
      slug: x.slug,
    }))
    .sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
})

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
      <Strategy :strategy="bot.strategy" />
    </div>
    <div v-else class="flex items-center gap-2">
      <select
        v-model="selectedStrategy"
        class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
      >
        <option
          v-for="strategy in strategies"
          :key="strategy.name"
          :value="strategy.slug"
          :selected="strategy.slug === selectedStrategy"
        >
          {{ strategy.name }}
        </option>
      </select>
      <div class="cursor-pointer" @click="deactivateForm">X</div>
    </div>
  </div>
</template>
