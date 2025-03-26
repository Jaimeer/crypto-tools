<script setup lang="ts">
import { ref } from 'vue'
import { useBingXConfigStore } from '../store/bingxConfig.store'

const bingXConfig = useBingXConfigStore()

const inputApiKey = ref(bingXConfig.apiKey)
const inputApiSecret = ref(bingXConfig.apiSecret)

const save = async () => {
  console.log({
    apiKey: inputApiKey.value,
    apiSecret: inputApiSecret.value,
  })
  bingXConfig.setConfig(inputApiKey.value, inputApiSecret.value)
  await window.electronAPI.setBingXCredentials(bingXConfig.apiKey, bingXConfig.apiSecret)
  bingXConfig.toggleViewConfig()
}
</script>

<template>
  <div class="p-4">
    <div>BingX Config</div>
    <form class="">
      <label for="apiKey" class="text-slate-600">API Key</label>
      <input
        id="apiKey"
        v-model="inputApiKey"
        type="text"
        placeholder="API Key"
        class="w-full p-2 mb-2 border border-gray-300 rounded"
      />
      <label for="apiSecret" class="text-slate-600">API Secret</label>
      <input
        id="apiSecret"
        v-model="inputApiSecret"
        type="password"
        placeholder="API Secret"
        class="w-full p-2 mb-2 border border-gray-300 rounded"
      />
      <button
        type="submit"
        class="w-full p-2 bg-blue-500 text-white rounded hover:cursor-pointer hover:opacity-90"
        @click.prevent="save"
      >
        Save
      </button>
    </form>
  </div>
</template>
