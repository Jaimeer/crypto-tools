<script setup lang="ts">
import { useBingxTransactionsStore } from '../store/bingx/bingxTransactions.store'
import { useBingxConfigStore } from '../store/bingx/bingxConfig.store'

import { RouterLink, useRoute, useRouter } from 'vue-router'

defineProps<{ page: 'bingx' | 'bitget' | 'charts' }>()
const bingxConfig = useBingxConfigStore()
const bingxTransactionsStore = useBingxTransactionsStore()
const router = useRouter()
const route = useRoute()

const openChartsWindow = () => {
  window.electronAPI.openChartsWindow()
  router.push('/')
}
</script>

<template>
  <div class="mb-4 flex items-center justify-between">
    <div class="flex items-center gap-2" flex items-center>
      <h1 class="text-xl font-bold">Crypto Tools</h1>
      <RouterLink
        to="/bingx"
        class="rounded bg-slate-500 px-4 py-1 transition hover:bg-slate-600"
        :class="{
          'bg-slate-500 text-white': page === 'bingx',
          'bg-slate-700 text-slate-400': page !== 'bingx',
        }"
      >
        BingX
      </RouterLink>
      <RouterLink
        to="/bitget"
        class="rounded bg-slate-500 px-4 py-1 transition hover:bg-slate-600"
        :class="{
          'bg-slate-500 text-white': page === 'bitget',
          'bg-slate-700 text-slate-400': page !== 'bitget',
        }"
      >
        Bitget
      </RouterLink>
      <!-- <RouterLink
        to="/charts"
        class="rounded bg-slate-500 px-4 py-1 text-white transition hover:bg-slate-600"
      >
        Charts
      </RouterLink>
      <button
        class="cursor-pointer rounded bg-blue-400 px-4 py-1 text-white transition hover:bg-blue-600"
        @click="openChartsWindow"
      >
        New Window
      </button> -->
      <slot name="left" />
    </div>
    <div class="flex items-center gap-2">
      <slot name="right" />
      <button
        @click="bingxConfig.toggleViewConfig"
        class="rounded bg-amber-500 px-4 py-1 text-white transition hover:bg-amber-600"
      >
        <span>Config</span>
      </button>
    </div>
  </div>
</template>
