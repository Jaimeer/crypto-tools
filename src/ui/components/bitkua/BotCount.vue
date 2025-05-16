<script setup lang="ts">
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
}>()
</script>

<template>
  <div
    class="w-fit rounded px-2 py-0.5 text-[10px]"
    :class="{
      'bg-slate-400 text-slate-950': bot.count === 0,
      'bg-green-400 text-green-950': bot.count > 0 && bot.count < 7,
      'bg-yellow-400 text-yellow-950': bot.count >= 7 && bot.count < 12,
      'bg-red-400 text-red-950': bot.count >= 12,
    }"
  >
    {{ bot.count }}
  </div>
</template>
