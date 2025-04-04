<script setup lang="ts">
import BingXTransactions from "./ui/components/BingXTransactions.vue";
import Config from "./ui/components/Config.vue";
import { useBingXConfigStore } from "./ui/store/bingxConfig.store";
import { useBitkuaConfigStore } from "./ui/store/bitkuaConfig.store";
import { computed, resolveComponent } from "vue";
import md5 from "md5";
import { useDark } from "@vueuse/core";

const isDark = useDark();
isDark.value = true;

const bingXConfig = useBingXConfigStore();
const bitkuaConfig = useBitkuaConfigStore();

resolveComponent;
const hashKey = computed(() => {
  const hash = md5(
    JSON.stringify({
      apiKey: bingXConfig.apiKey,
      apiSecret: bingXConfig.apiSecret,
    }),
  );
  return hash;
});

if (bingXConfig.apiKey && bingXConfig.apiSecret) {
  try {
    window.electronAPI.setBingXCredentials(
      bingXConfig.apiKey,
      bingXConfig.apiSecret,
    );
    console.log("BingX service initialized successfully");
  } catch (error) {
    console.error("Failed to initialize BingX service:", error);
  }
}

if (bitkuaConfig.email && bitkuaConfig.password && bitkuaConfig.secret) {
  try {
    window.electronAPI.setBitkuaCredentials(
      bitkuaConfig.email,
      bitkuaConfig.password,
      bitkuaConfig.secret,
    );
    console.log("Bitkua service initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Bitkua service:", error);
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-900 text-slate-200">
    <Config v-if="bingXConfig.viewConfig" />
    <div v-else :key="hashKey">
      <RouterView />
    </div>
  </div>
</template>
