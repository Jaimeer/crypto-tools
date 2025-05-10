<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref } from 'vue'

const props = defineProps<{
  headers: string[]
  items: T[]
  fullHeight?: boolean
  headerClass?: string
  disableSort?: boolean
}>()

const sortedItems = computed(() => {
  if (!sortValue.value || props.disableSort) return props.items
  return props.items.sort((a, b) => {
    const valueA = a[sortValue.value]
    const valueB = b[sortValue.value]
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      if (sortAsc.value) return valueA.localeCompare(valueB)
      return valueB.localeCompare(valueA)
    }
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      if (sortAsc.value) return valueA - valueB
      return valueB - valueA
    }
    if (valueA instanceof Date && valueB instanceof Date) {
      if (sortAsc.value) return valueA.getTime() - valueB.getTime()
      return valueB.getTime() - valueA.getTime()
    }

    return 0
  })
})

const sortValue = ref('')
const sortAsc = ref(true)

const sortByHeader = (header: string) => {
  if (sortValue.value === header) sortAsc.value = !sortAsc.value
  else sortAsc.value = true

  sortValue.value = header
}
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
      :key="`${sortValue}-${sortAsc}`"
    >
      <thead
        v-if="headers.length || $slots.headers"
        class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <slot name="headers">
            <th
              class="cursor-pointer px-2 py-0.5"
              :class="headerClass"
              v-for="header of headers"
              :key="header"
              @click="sortByHeader(header)"
            >
              {{ header }}
            </th>
          </slot>
        </tr>
      </thead>
      <tbody>
        <slot name="tbody">
          <tr
            v-for="item in sortedItems"
            class="border-b border-gray-200 bg-white text-nowrap hover:bg-slate-700 dark:border-gray-700 dark:bg-gray-800"
          >
            <slot :item="item" />
          </tr>
        </slot>
      </tbody>
    </table>
  </div>
</template>
