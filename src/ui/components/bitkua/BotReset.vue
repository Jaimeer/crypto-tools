<script setup lang="ts">
import { BitkuaActionReset } from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
}>()

const sendAction = (botId: string) => {
  const message: BitkuaActionReset = {
    action: 'reset',
    botId,
    symbol: props.bot.symbol,
    positionSide: props.bot.positionSide,
  }
  window.electronAPI.sendBitkuaAction(message)
}
</script>

<template>
  <div
    class="cursor-pointer rounded px-2 py-0.5 font-bold text-yellow-600 hover:text-yellow-800"
    @click="sendAction(bot.id)"
  >
    reset
  </div>
</template>
