<script setup lang="ts">
import Config from './ui/components/Config.vue'
import { useBingxConfigStore } from './ui/store/bingx/bingxConfig.store'
import { useBitkuaConfigStore } from './ui/store/bitkua/bitkuaConfig.store'
import { computed } from 'vue'
import md5 from 'md5'
import { useDark } from '@vueuse/core'
import { useBitgetConfigStore } from './ui/store/bitget/bitgetConfig.store'
import { useKucoinConfigStore } from './ui/store/kucoin/kucoinConfig.store'

const isDark = useDark()
isDark.value = true

const bingxConfig = useBingxConfigStore()
const bitkuaConfig = useBitkuaConfigStore()
const bitgetConfig = useBitgetConfigStore()
const kucoinConfig = useKucoinConfigStore()

const hashKey = computed(() => {
  const hash = md5(
    JSON.stringify({
      apiKey: bingxConfig.apiKey,
      apiSecret: bingxConfig.apiSecret,
    }),
  )
  return hash
})

if (bingxConfig.apiKey && bingxConfig.apiSecret) {
  try {
    window.electronAPI.setBingXCredentials(
      bingxConfig.apiKey,
      bingxConfig.apiSecret,
    )

    console.log('BingX service initialized successfully')
  } catch (error) {
    console.error('Failed to initialize BingX service:', error)
  }
}

if (bitgetConfig.apiKey && bitgetConfig.apiSecret && bitgetConfig.password) {
  try {
    window.electronAPI.setBitgetCredentials(
      bitgetConfig.apiKey,
      bitgetConfig.apiSecret,
      bitgetConfig.password,
    )
    console.log('Bitget service initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Bitget service:', error)
  }
}

if (kucoinConfig.apiKey && kucoinConfig.apiSecret && kucoinConfig.password) {
  try {
    window.electronAPI.setKucoinCredentials(
      kucoinConfig.apiKey,
      kucoinConfig.apiSecret,
      kucoinConfig.password,
    )
    console.log('Kucoin service initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Kucoin service:', error)
  }
}

if (bitkuaConfig.username && bitkuaConfig.token) {
  try {
    window.electronAPI.setBitkuaCredentials(
      bitkuaConfig.username,
      bitkuaConfig.token,
    )
    console.log('Bitkua service initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Bitkua service:', error)
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-900 text-slate-200">
    <Config v-if="bingxConfig.viewConfig" />
    <div v-else :key="hashKey" class="h-screen w-full overflow-y-auto">
      <RouterView />
    </div>
  </div>
</template>
