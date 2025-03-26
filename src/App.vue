<script setup lang="ts">
import BingXTransactions from './ui/components/BingXTransactions.vue'
import BingXConfig from './ui/components/BingXConfig.vue'
import { useBingXConfigStore } from './ui/store/bingxConfig.store'
import { computed, onMounted } from 'vue'
import md5 from 'md5'

const bingXConfig = useBingXConfigStore()

const hashKey = computed(() => {
  const hash = md5(
    JSON.stringify({
      apiKey: bingXConfig.apiKey,
      apiSecret: bingXConfig.apiSecret,
    })
  )
  return hash
})

if (bingXConfig.apiKey && bingXConfig.apiSecret) {
  try {
    window.electronAPI.setBingXCredentials(bingXConfig.apiKey, bingXConfig.apiSecret)
    console.log('BingX service initialized successfully')
  } catch (error) {
    console.error('Failed to initialize BingX service:', error)
  }
}
</script>

<template>
  <div>
    <BingXConfig v-if="bingXConfig.viewConfig" />
    <BingXTransactions :key="hashKey" v-else />
  </div>
</template>
