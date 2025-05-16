<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import DateTime from '../general/DateTime.vue'
import { useNotificationsStore } from '../../store/general/notifications.store'
import { onClickOutside } from '@vueuse/core'
import Exchange from '../trading/Exchange.vue'
import Tag from '../general/Tag.vue'
import KeyValue from './KeyValue.vue'
import { Icon } from '@iconify/vue'

const notificationsStore = useNotificationsStore()

const viewData = ref(false)

const target = useTemplateRef<HTMLElement>('target')
onClickOutside(target, () => (viewData.value = false))

watch(viewData, () => {
  if (viewData.value) notificationsStore.cleanPendingNotifications()
})
</script>

<template>
  <div
    class="relative cursor-pointer rounded bg-pink-500 px-4 py-1 text-white transition hover:bg-pink-600"
    @click.prevent="viewData = !viewData"
  >
    <Icon icon="mdi:bell-outline" class="h-6 w-6 text-white" />
    <div
      v-if="notificationsStore.pendingNotifications > 0"
      class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs"
    >
      {{ notificationsStore.pendingNotifications }}
    </div>
  </div>
  <div
    v-if="viewData"
    ref="target"
    class="absolute top-14 right-4 z-40 flex max-h-2/3 w-[28rem] min-w-96 flex-col gap-3 overflow-y-auto rounded border border-slate-500 bg-slate-800 p-4 transition"
  >
    <div
      v-for="notification in notificationsStore.notifications"
      :key="notification.id"
      class="relative flex h-full w-full"
    >
      <div class="flex h-fit w-full items-center gap-2">
        <div
          class="absolute top-0 bottom-0 left-0 w-1 shrink-0"
          :class="{
            'bg-red-600': notification.type === 'error',
            'bg-yellow-600': notification.type === 'warning',
            'bg-green-600': notification.type === 'success',
            'bg-slate-600': notification.type === 'info',
          }"
        >
          &nbsp;
        </div>
        <div class="flex w-full flex-col gap-0.5 pl-4">
          <div class="flex w-full items-center justify-between gap-2">
            <div class="flex items-center gap-1">
              <div class="text-sm font-bold">{{ notification.title }}</div>
              <DateTime
                :value="notification.date"
                class="text-xs text-slate-400"
              />
            </div>
            <div class="flex items-center gap-1 text-[10px]">
              <Tag
                :value="notification.action"
                color="violet"
                class="text-[10px]"
              />
              <Exchange :value="notification.api" />
            </div>
          </div>
          <div class="text-xs text-slate-400">{{ notification.message }}</div>
          <div
            v-if="notification.metadata"
            class="flex flex-wrap items-center gap-1 text-xs"
          >
            <KeyValue
              v-for="[key, value] in Object.entries(notification.metadata)"
              :key="key"
              :keyValue="key"
              :value="value"
              color="blue"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
