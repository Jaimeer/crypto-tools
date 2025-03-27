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
  <div class="p-4 flex flex-col gap-4 justify-center items-center h-screen">
    <div class="text-4xl">BingX Config</div>
    <form class="">
      <label for="apiKey" class="text-slate-400">API Key</label>
      <input
        id="apiKey"
        v-model="inputApiKey"
        type="text"
        placeholder="API Key"
        class="w-full p-2 mb-2 border border-gray-300 rounded"
      />
      <label for="apiSecret" class="text-slate-400">API Secret</label>
      <input
        id="apiSecret"
        v-model="inputApiSecret"
        type="password"
        placeholder="API Secret"
        class="w-full p-2 mb-2 border border-gray-300 rounded"
      />
      <div class="italic my-4 text-slate-500 text-right">Api key only need read permissions</div>
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
