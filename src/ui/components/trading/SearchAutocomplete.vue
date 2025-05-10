<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  items: string[]
  placeHolder: string
  disabled?: boolean
}>()

const value = defineModel<string>()

const filteredSymbols = computed(() => {
  return props.items.filter(
    (item) =>
      !item.endsWith('USDC') &&
      item.toLowerCase().includes(value.value.toLowerCase()),
  )
})

const viewItems = ref(false)

const closeItems = () => {
  setTimeout(() => {
    viewItems.value = false
  }, 100)
}
</script>

<template>
  <div>
    <input
      type="text"
      v-model="value"
      :placeholder="placeHolder"
      class="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-slate-200 focus:border-slate-500 focus:outline-none"
      :class="{ 'disabled:opacity-50': disabled }"
      :disabled="disabled"
      @focus="viewItems = true"
      @blur="closeItems"
    />
    <ul
      v-if="viewItems"
      class="absolute z-10 mt-1 max-h-60 w-48 overflow-auto rounded border border-slate-600 bg-slate-700 text-slate-200"
    >
      <li
        v-for="item in filteredSymbols"
        :key="item"
        @click="value = item"
        class="cursor-pointer px-1 hover:bg-slate-600"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>
