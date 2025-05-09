<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useBingxConfigStore } from '../../store/bingx/bingxConfig.store'
import { RouterLink } from 'vue-router'

defineProps<{ page: 'bingx' | 'bitget' | 'charts' | 'bots' }>()
const bingxConfig = useBingxConfigStore()

const search = defineModel()
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
          v-model="search"
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
      <button
        @click="bingxConfig.toggleViewConfig"
        class="rounded bg-amber-500 px-4 py-1 text-white transition hover:bg-amber-600"
      >
        <span>Config</span>
      </button>
      <!-- <a
        href="https://app.bitkua.com?reference=jaime_odh"
        class="rounded bg-amber-500 px-4 py-1 text-white transition hover:bg-amber-600"
      >
        <span>Register in Bitkua</span>
      </a> -->
    </div>
  </div>
</template>
