<script setup lang="ts">
import { BitkuaActionUpdateSafe } from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
}>()

const sendAction = (botId: string, safe: boolean) => {
  const message: BitkuaActionUpdateSafe = {
    action: 'updateSafe',
    botId,
    safe,
  }
  window.electronAPI.sendBitkuaAction(message)
}
</script>

<template>
  <div
    class="w-fit cursor-pointer rounded px-2 py-0.5 font-bold"
    :class="{
      'bg-green-600 text-white hover:bg-green-800': bot.safe,
      'bg-slate-600 text-white hover:bg-slate-800': !bot.safe,
    }"
    @click="sendAction(bot.id, !bot.safe)"
  >
    safe
  </div>
</template>
