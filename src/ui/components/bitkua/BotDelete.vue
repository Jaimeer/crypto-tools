<script setup lang="ts">
import { BitkuaActionDelete } from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
  shortMode?: boolean
}>()

const sendAction = (botId: string) => {
  const message: BitkuaActionDelete = {
    action: 'delete',
    botId,
  }
  window.electronAPI.sendBitkuaAction(message)
}
</script>

<template>
  <div
    class="cursor-pointer rounded px-1 font-bold text-red-600 hover:text-red-800"
    v-tooltip="shortMode ? 'delete' : ''"
    @click="sendAction(bot.id)"
  >
    {{ shortMode ? 'D' : 'delete' }}
  </div>
</template>
