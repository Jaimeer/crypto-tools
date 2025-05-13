<script setup lang="ts">
import { BitkuaActionReset } from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
  shortMode?: boolean
}>()

const sendAction = (botId: string) => {
  const message: BitkuaActionReset = {
    action: 'reset',
    botId,
    symbol: props.bot.symbol,
  }
  window.electronAPI.sendBitkuaAction(message)
}
</script>

<template>
  <div
    class="cursor-pointer rounded px-1 font-bold text-purple-600 hover:text-purple-800"
    v-tooltip="shortMode ? 'reset' : ''"
    @click="sendAction(bot.id)"
  >
    {{ shortMode ? 'R' : 'reset' }}
  </div>
</template>
