<script setup lang="ts">
import { ref } from "vue";
import { useBingXConfigStore } from "../store/bingxConfig.store";
import { useBitkuaConfigStore } from "../store/bitkuaConfig.store";

const bingXConfig = useBingXConfigStore();
const bitkuaConfig = useBitkuaConfigStore();

const inputApiKey = ref(bingXConfig.apiKey);
const inputApiSecret = ref(bingXConfig.apiSecret);
const inputEmail = ref(bitkuaConfig.email);
const inputPassword = ref(bitkuaConfig.password);
const inputSecret = ref(bitkuaConfig.secret);

const save = async () => {
  await bingXConfig.setConfig(inputApiKey.value, inputApiSecret.value);
  await bitkuaConfig.setConfig(
    inputEmail.value,
    inputPassword.value,
    inputSecret.value,
  );

  bingXConfig.toggleViewConfig();
};
</script>

<template>
  <div class="flex h-screen flex-col items-center justify-center gap-4 p-4">
    <form class="">
      <div class="text-4xl">BingX Config</div>

      <label for="apiKey" class="text-slate-400">API Key</label>
      <input
        id="apiKey"
        v-model="inputApiKey"
        type="text"
        placeholder="API Key"
        class="mb-2 w-full rounded border border-gray-300 p-2"
      />
      <label for="apiSecret" class="text-slate-400">API Secret</label>
      <input
        id="apiSecret"
        v-model="inputApiSecret"
        type="password"
        placeholder="API Secret"
        class="mb-2 w-full rounded border border-gray-300 p-2"
      />
      <div class="my-4 text-right text-slate-500 italic">
        Api key only need read permissions
      </div>

      <div class="text-4xl">Bitkua Config</div>

      <label for="apiKey" class="text-slate-400">Email</label>
      <input
        id="email"
        v-model="inputEmail"
        type="text"
        placeholder="Email"
        class="mb-2 w-full rounded border border-gray-300 p-2"
      />
      <label for="apiSecret" class="text-slate-400">Password</label>
      <input
        id="password"
        v-model="inputPassword"
        type="password"
        placeholder="Password"
        class="mb-2 w-full rounded border border-gray-300 p-2"
      />
      <label for="apiSecret" class="text-slate-400">2FA Secret</label>
      <input
        id="secret"
        v-model="inputSecret"
        type="password"
        placeholder="2FA Secret"
        class="mb-2 w-full rounded border border-gray-300 p-2"
      />

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
