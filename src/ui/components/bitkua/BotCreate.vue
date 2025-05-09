<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { BitkuaActionCreateBot } from '../../../server/bitkua/Bitkua.dto'
import { useBingxContractsStore } from '../../../ui/store/bingx/bingxContracts.store'
import { useBitgetContractsStore } from '../../../ui/store/bitget/bitgetContracts.store'
import SearchAutocomplete from '../trading/SearchAutocomplete.vue'

const bingxContractsStore = useBingxContractsStore()
const bitgetContractsStore = useBitgetContractsStore()

const botStrategies = [
  ,
  'aiexpertavg',
  'aiexpertavgplus',
  'degen',
  'infinity',
  'karlosavg',
  'ladominantkong',
  'lamilagrosa',
  'lamilagrosapro',
  'liquidationpoint',
  'liquiditypool',
  'longalashitcoin',
  'pmd',
  'smartcandle',
  'smartmoney',
  'sniperagresive',
]

const botExchange = ['Bingx', 'Bitget'] as const
const botStatus = ['active', 'stop'] as const

const exchangeSymbols = computed<
  Record<(typeof botExchange)[number], string[]>
>(() => ({
  Bingx: bingxContractsStore.contracts
    .map((x) => x.symbol)
    .sort((a, b) => a.localeCompare(b)),
  Bitget: bitgetContractsStore.contracts
    .map((x) => x.symbol)
    .sort((a, b) => a.localeCompare(b)),
}))

const formData = reactive<BitkuaActionCreateBot>({
  action: 'createBot',
  exchange: 'Bingx',
  symbol: '',
  amount: undefined,
  strategy: 'lamilagrosapro',
  status: 'active',
  safe: false,
  long: false,
  short: false,
})

const createBot = () => {
  const message: BitkuaActionCreateBot = { ...formData }
  window.electronAPI.sendBitkuaAction(message)
  formData.symbol = ''
  formData.amount = undefined
}

const isValid = computed(() => {
  if (!formData.symbol) return false
  if (!formData.amount) return false
  if (!formData.strategy) return false
  if (!formData.status) return false
  if (!formData.exchange) return false
  if (!formData.long && !formData.short) return false
  return true
})
</script>

<template>
  <form class="flex w-full items-center gap-2" @submit.prevent="createBot">
    <select
      v-model="formData.exchange"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
    >
      <option
        v-for="exchange in botExchange.toSorted((a, b) => a.localeCompare(b))"
        :key="exchange"
        :value="exchange"
      >
        {{ exchange }}
      </option>
    </select>

    <SearchAutocomplete
      v-model="formData.symbol"
      :items="
        exchangeSymbols[formData.exchange].toSorted((a, b) =>
          a.localeCompare(b),
        )
      "
      placeHolder="Search symbol"
    />

    <select
      v-model="formData.strategy"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
    >
      <option
        v-for="strategy in botStrategies.toSorted((a, b) => a.localeCompare(b))"
        :key="strategy"
        :value="strategy"
      >
        {{ strategy }}
      </option>
    </select>
    <input
      v-model.number="formData.amount"
      type="number"
      placeholder="Amount 10%"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
    />
    <select
      v-model="formData.status"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
    >
      <option v-for="action in botStatus" :key="action" :value="action">
        {{ action }}
      </option>
    </select>

    <div
      class="cursor-pointer rounded px-2 py-0.5 focus:border-slate-500 focus:outline-none"
      :class="{
        'bg-green-600 text-slate-200': formData.long,
        'bg-slate-800 text-slate-600': !formData.long,
      }"
      @click="formData.long = !formData.long"
    >
      Long
    </div>

    <div
      class="cursor-pointer rounded px-2 py-0.5 focus:border-slate-500 focus:outline-none"
      :class="{
        'bg-red-600 text-slate-200': formData.short,
        'bg-slate-800 text-slate-600': !formData.short,
      }"
      @click="formData.short = !formData.short"
    >
      Short
    </div>
    <div
      class="cursor-pointer rounded px-2 py-0.5 focus:border-slate-500 focus:outline-none"
      :class="{
        'bg-yellow-600 text-slate-200': formData.safe,
        'bg-slate-800 text-slate-600': !formData.safe,
      }"
      @click="formData.safe = !formData.safe"
    >
      Safe
    </div>
    <button
      type="submit"
      class="rounded px-2 py-0.5"
      :class="{
        'cursor-pointer bg-green-700 text-slate-200': isValid,
        'bg-slate-800 text-slate-600': !isValid,
      }"
      :disabled="!isValid"
    >
      Create Bot
    </button>
  </form>
</template>
