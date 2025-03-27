<script setup lang="ts" generic="T">
const props = defineProps<{ headers: string[]; items: T[]; fullHeight?: boolean }>()
</script>

<template>
  <div
    class="overflow-y-auto overflow-x-auto"
    :class="{
      ' max-h-96': !props.fullHeight,
      ' max-h-fit': props.fullHeight,
    }"
  >
    <table class="w-full text-xs text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th class="px-2 py-2" v-for="header of headers">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
        >
          <slot :item="item" />
        </tr>
      </tbody>
    </table>
  </div>
</template>
