<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type {
  BitkuaActionCreateBot,
  BotExchange,
} from '../../../server/bitkua/Bitkua.dto'
import { useBingxContractsStore } from '../../../ui/store/bingx/bingxContracts.store'
import { useBitgetContractsStore } from '../../../ui/store/bitget/bitgetContracts.store'
import SearchAutocomplete from '../trading/SearchAutocomplete.vue'
import { useBitkuaSecurityTokensStore } from '../../store/bitkua/bitkuaSecurityTokens.store'
import { useBitkuaStrategiesStore } from '../../store/bitkua/bitkuaStrategies.store'

const props = defineProps<{ symbol?: string; exchange?: BotExchange }>()

const bingxContractsStore = useBingxContractsStore()
const bitgetContractsStore = useBitgetContractsStore()
const bitkuaSecurityTokensStore = useBitkuaSecurityTokensStore()
const bitkuaStrategiesStore = useBitkuaStrategiesStore()

const botStrategies = computed(() => {
  return bitkuaStrategiesStore.strategies
    .filter((x) => x.positionside === 'LONG')
    .map((x) => ({ ...x, name: x.name.replace('Long', '') }))
})

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
  exchange: props.exchange ?? 'Bingx',
  tokenId:
    bitkuaSecurityTokensStore.securityTokens.filter(
      (x) => x.exchange === (props.exchange ?? 'Bingx'),
    ).length === 1
      ? bitkuaSecurityTokensStore.securityTokens.filter(
          (x) => x.exchange === (props.exchange ?? 'Bingx'),
        )[0].tokenId
      : '',
  symbol: props.symbol ?? '',
  amount: undefined,
  strategy: 'lamilagrosapro',
  status: 'active',
  safe: false,
  long: false,
  short: false,
})

const availableSecurityTokes = computed(() => {
  return bitkuaSecurityTokensStore.securityTokens.filter(
    (x) => x.exchange === formData.exchange,
  )
})

watch(
  () => availableSecurityTokes.value,
  () => {
    if (availableSecurityTokes.value.length === 1)
      formData.tokenId = availableSecurityTokes.value[0].tokenId
  },
  { deep: true, immediate: true },
)

const createBot = () => {
  const message: BitkuaActionCreateBot = { ...formData }
  window.electronAPI.sendBitkuaAction(message)
  formData.symbol = props.symbol ?? ''
  formData.amount = undefined
}

const isValid = computed(() => {
  if (!formData.symbol) return false
  if (!formData.amount) return false
  if (!formData.tokenId) return false
  if (!formData.strategy) return false
  if (!formData.status) return false
  if (!formData.exchange) return false
  if (!formData.long && !formData.short) return false
  if (!exchangeSymbols.value[formData.exchange].includes(formData.symbol))
    return false
  return true
})
</script>

<template>
  <form class="flex items-center gap-2" @submit.prevent="createBot">
    <select
      v-model="formData.exchange"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none disabled:opacity-50"
      :disabled="!!props.exchange"
    >
      <option
        v-for="exchange in botExchange.toSorted((a, b) => a.localeCompare(b))"
        :key="exchange"
        :value="exchange"
      >
        {{ exchange }}
      </option>
    </select>
    <select
      v-model="formData.tokenId"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none disabled:opacity-50"
      :disabled="availableSecurityTokes.length === 1"
    >
      <option
        v-for="securityToken in availableSecurityTokes"
        :key="securityToken.securityToken"
        :value="securityToken.tokenId"
      >
        {{ securityToken.securityToken }}
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
      :disabled="!!props.symbol"
    />

    <!-- <pre>{{ bitkuaStrategiesStore }}</pre> -->
    <select
      v-model="formData.strategy"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
    >
      <option
        v-for="strategy in botStrategies"
        :key="strategy.name"
        :value="strategy.slug"
      >
        {{ strategy.name }}
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
    <!-- <pre>{{ formData }}</pre> -->
  </form>
</template>
