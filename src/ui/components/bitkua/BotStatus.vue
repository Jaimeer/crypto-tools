<script setup lang="ts">
import { BitkuaActionUpdateStatus } from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
}>()

const botStatus = ['active', 'stop', 'onlysell'] as const

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
    <button
      v-for="status in botStatus"
      class="cursor-pointer rounded px-1 text-xs transition disabled:cursor-default"
      :class="{
        'text-green-600 hover:text-green-400 disabled:bg-green-900 disabled:text-green-200':
          status === 'active',
        'text-red-600 hover:text-red-400 disabled:bg-red-900 disabled:text-red-200':
          status === 'stop',
        'text-amber-600 hover:text-amber-400 disabled:bg-amber-900 disabled:text-amber-200':
          status === 'onlysell',
      }"
      :disabled="bot.status === status"
      @click="sendAction(bot.id, status)"
    >
      {{ status }}
    </button>
  </div>
</template>
