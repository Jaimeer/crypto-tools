<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  BitkuaActionUpdateAmount,
  BitkuaActionUpdateStrategy,
} from '../../../server/bitkua/Bitkua.dto'
import { Bot } from '../../../server/data.dto'

const props = defineProps<{
  bot: Bot
}>()

const isFormActive = ref(false)

const amount = ref(0)
const inputAmount = ref('')

const sendAction = (botId: string, amount: number) => {
  const message: BitkuaActionUpdateAmount = {
    action: 'updateAmount',
    botId,
    amount,
  }
  window.electronAPI.sendBitkuaAction(message)
  deactivateForm()
}

const activateForm = () => {
  inputAmount.value = props.bot.amount.toString()
  isFormActive.value = true
}

const deactivateForm = () => {
  inputAmount.value = '0'
  isFormActive.value = false
}

const processAmount = () => {
  amount.value = parseInt(inputAmount.value)
}

watch(
  () => amount.value,
  (newAmount) => {
    if (newAmount && newAmount !== props.bot.amount)
      sendAction(props.bot.id, newAmount)
  },
)

watch(
  () => inputAmount.value,
  (newAmount) => {
    const sanitizedAmount = newAmount.replace(/[^0-9]/g, '')
    inputAmount.value = sanitizedAmount
  },
)
</script>

<template>
  <div class="text-[10px]">
    <div
      v-if="!isFormActive"
      @click="activateForm"
      class="w-fit cursor-pointer rounded bg-slate-600 px-2 py-0.5 hover:text-slate-500"
    >
      {{ bot.amount }}
    </div>
    <div v-else class="flex items-center gap-2">
      <input
        v-model="inputAmount"
        type="text"
        placeholder="Insert amount"
        class="w-8 rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
        @keyup.enter="processAmount"
      />
      <div class="cursor-pointer" @click="deactivateForm">X</div>
    </div>
  </div>
</template>
