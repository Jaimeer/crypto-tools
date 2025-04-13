<script setup lang="ts" generic="T">
const props = defineProps<{
  headers: string[];
  items: T[];
  fullHeight?: boolean;
}>();
</script>

<template>
  <div
    class="overflow-x-auto overflow-y-auto"
    :class="{
      'max-h-98': !props.fullHeight,
      'max-h-fit': props.fullHeight,
    }"
  >
    <table
      class="w-full text-left text-xs text-gray-500 rtl:text-right dark:text-gray-400"
    >
      <thead
        v-if="headers.length || $slots.headers"
        class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <slot name="headers">
            <th class="px-2 py-0.5" v-for="header of headers" :key="header">
              {{ header }}
            </th>
          </slot>
        </tr>
      </thead>
      <tbody>
        <slot name="tbody">
          <tr
            v-for="item in items"
            class="border-b border-gray-200 bg-white text-nowrap hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
          >
            <slot :item="item" />
          </tr>
        </slot>
      </tbody>
    </table>
  </div>
</template>
