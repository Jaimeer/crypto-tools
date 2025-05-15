<script setup lang="ts">
import { ref } from 'vue'
import { useBingxConfigStore } from '../store/bingx/bingxConfig.store'
import { useBitkuaConfigStore } from '../store/bitkua/bitkuaConfig.store'
import { useBitgetConfigStore } from '../store/bitget/bitgetConfig.store'
import { useKucoinConfigStore } from '../store/kucoin/kucoinConfig.store'

const bingxConfig = useBingxConfigStore()
const bitkuaConfig = useBitkuaConfigStore()
const bitgetConfig = useBitgetConfigStore()
const kucoinConfig = useKucoinConfigStore()

const inputBingxApiKey = ref(bingxConfig.apiKey)
const inputBingxApiSecret = ref(bingxConfig.apiSecret)

const inputBitgetApiKey = ref(bitgetConfig.apiKey)
const inputBitgetApiSecret = ref(bitgetConfig.apiSecret)
const inputBitgetPassword = ref(bitgetConfig.password)

const inputKucoinApiKey = ref(kucoinConfig.apiKey)
const inputKucoinApiSecret = ref(kucoinConfig.apiSecret)
const inputKucoinPassword = ref(kucoinConfig.password)

const inputBitkuaUserName = ref(bitkuaConfig.username)
const inputBitkuaToken = ref(bitkuaConfig.token)

const save = async () => {
  await bingxConfig.setConfig(inputBingxApiKey.value, inputBingxApiSecret.value)
  await bitkuaConfig.setConfig(
    inputBitkuaUserName.value,
    inputBitkuaToken.value,
  )
  await bitgetConfig.setConfig(
    inputBitgetApiKey.value,
    inputBitgetApiSecret.value,
    inputBitgetPassword.value,
  )
  await kucoinConfig.setConfig(
    inputKucoinApiKey.value,
    inputKucoinApiSecret.value,
    inputKucoinPassword.value,
  )
  bingxConfig.toggleViewConfig()
}
</script>

<template>
  <div class="flex h-screen flex-col items-center justify-center gap-4 p-4">
    <form class="">
      <div>
        <div class="text-4xl">BingX Config</div>

        <label for="bingxApiKey" class="text-slate-400">API Key</label>
        <input
          id="bingxApiKey"
          v-model="inputBingxApiKey"
          type="text"
          placeholder="API Key"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
        <label for="bingxApiSecret" class="text-slate-400">API Secret</label>
        <input
          id="bingxApiSecret"
          v-model="inputBingxApiSecret"
          type="password"
          placeholder="API Secret"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
        <div class="my-4 text-right text-slate-500 italic">
          Api key only need read permissions
        </div>
      </div>

      <div>
        <div class="text-4xl">Bitget Config</div>

        <label for="bitgetApiKey" class="text-slate-400">API Key</label>
        <input
          id="bitgetApiKey"
          v-model="inputBitgetApiKey"
          type="text"
          placeholder="API Key"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
        <label for="bitgetApiSecret" class="text-slate-400">API Secret</label>
        <input
          id="bitgetApiSecret"
          v-model="inputBitgetApiSecret"
          type="password"
          placeholder="API Secret"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
        <label for="bitgetPassword" class="text-slate-400">Password</label>
        <input
          id="bitgetPassword"
          v-model="inputBitgetPassword"
          type="password"
          placeholder="Password"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />

        <div class="my-4 text-right text-slate-500 italic">
          Api key only need read permissions
        </div>
      </div>
      <div>
        <div class="text-4xl">Kucoin Config</div>

        <label for="kucoinApiKey" class="text-slate-400">API Key</label>
        <input
          id="kucoinApiKey"
          v-model="inputKucoinApiKey"
          type="text"
          placeholder="API Key"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
        <label for="kucoinApiSecret" class="text-slate-400">API Secret</label>
        <input
          id="kucoinApiSecret"
          v-model="inputKucoinApiSecret"
          type="password"
          placeholder="API Secret"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
        <label for="kucoinPassword" class="text-slate-400">Password</label>
        <input
          id="kucoinPassword"
          v-model="inputKucoinPassword"
          type="password"
          placeholder="Password"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />

        <div class="my-4 text-right text-slate-500 italic">
          Api key only need read permissions
        </div>
      </div>
      <div>
        <div class="text-4xl">Bitkua Config</div>

        <label for="username" class="text-slate-400">UserName</label>
        <input
          id="username"
          v-model="inputBitkuaUserName"
          type="text"
          placeholder="UserName"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
        <label for="token" class="text-slate-400">Token</label>
        <input
          id="token"
          v-model="inputBitkuaToken"
          type="password"
          placeholder="Token"
          class="mb-2 w-full rounded border border-gray-300 p-2"
        />
      </div>

      <div class="my-8 text-right text-slate-500 italic"></div>

      <button
        type="submit"
        class="w-full rounded bg-blue-500 p-2 text-white hover:cursor-pointer hover:opacity-90"
        @click.prevent="save"
      >
        Save
      </button>
    </form>
  </div>
</template>
