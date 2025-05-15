<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useBingxConfigStore } from '../../store/bingx/bingxConfig.store'
import { RouterLink } from 'vue-router'
import ButtonReferral from '../bitkua/ButtonReferral.vue'
import NotificationsHistory from './NotificationsHistory.vue'
import { watchDebounced } from '@vueuse/core'
import { ref } from 'vue'

defineProps<{ page: 'bingx' | 'bitget' | 'charts' | 'bots' | 'data-market' }>()
const bingxConfig = useBingxConfigStore()

const search = defineModel()
const localSearch = ref('')

watchDebounced(
  localSearch,
  () => {
    search.value = localSearch.value
  },
  { debounce: 200 },
)
</script>

<template>
  <div class="mb-4 flex items-center justify-between">
    <div class="flex items-center gap-2" flex items-center>
      <h1 class="text-xl font-bold">Dashboard</h1>
      <RouterLink
        to="/bots"
        class="rounded bg-slate-500 px-4 py-1 transition hover:bg-slate-600"
        :class="{
          'bg-slate-500 text-white': page === 'bots',
          'bg-slate-700 text-slate-400': page !== 'bots',
        }"
      >
        Bots
      </RouterLink>
      <RouterLink
        to="/data-market"
        class="rounded bg-slate-500 px-4 py-1 transition hover:bg-slate-600"
        :class="{
          'bg-slate-500 text-white': page === 'data-market',
          'bg-slate-700 text-slate-400': page !== 'data-market',
        }"
      >
        Data Market
      </RouterLink>
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
      <slot name="left" />
    </div>
    <div>
      <div class="flex items-center gap-2">
        <slot name="pre-search" />
        <input
          id="search"
          v-model="localSearch"
          type="text"
          placeholder="Search..."
          class="w-96 rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-200 focus:border-slate-500 focus:outline-none"
        />
        <Icon
          icon="mdi:remove"
          class="cursor-pointer text-slate-400 hover:text-slate-200"
          width="20"
          height="20"
          @click="search = ''"
        />
        <slot name="post-search" />
      </div>
    </div>
    <div class="flex items-center gap-2">
      <slot name="right" />
      <ButtonReferral />
      <button
        @click="bingxConfig.toggleViewConfig"
        class="cursor-pointer rounded bg-amber-500 px-4 py-1 text-white transition hover:bg-amber-600"
      >
        <Icon icon="mdi:cog" class="h-6 w-6 text-white" />
      </button>
      <NotificationsHistory />
    </div>
  </div>
</template>
