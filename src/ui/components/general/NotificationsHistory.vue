<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DateTime from '../general/DateTime.vue'
import { useNotificationsStore } from '../../store/general/notifications.store'
import { onClickOutside } from '@vueuse/core'
import Exchange from '../trading/Exchange.vue'

const notificationsStore = useNotificationsStore()

const viewData = ref(false)

const target = useTemplateRef<HTMLElement>('target')
onClickOutside(target, () => (viewData.value = false))
</script>

<template>
  <div
    class="cursor-pointer rounded bg-pink-500 px-4 py-1 text-white transition hover:bg-pink-600"
    @click.prevent="viewData = !viewData"
  >
    Notifications ({{ notificationsStore.notifications.length }})
  </div>
  <div
    v-if="viewData"
    ref="target"
    class="absolute top-14 right-4 z-40 flex max-h-2/3 min-w-96 flex-col gap-3 overflow-y-auto rounded border border-slate-500 bg-slate-800 p-4 transition"
  >
    <div
      v-for="notification in notificationsStore.notifications"
      :key="notification.id"
    >
      <div class="flex items-center gap-2">
        <div
          class="h-10 w-1"
          :class="{
            'bg-red-600': notification.type === 'error',
            'bg-yellow-600': notification.type === 'warning',
            'bg-green-600': notification.type === 'success',
            'bg-slate-600': notification.type === 'info',
          }"
        >
          &nbsp;
        </div>
        <div>
          <div class="flex items-center gap-2">
            <div class="text-sm font-bold uppercase">
              {{ notification.action }}
            </div>
            <div class="text-xs text-slate-400">
              <DateTime :value="notification.date" />
            </div>
            <div class="text-[8px]">
              <Exchange :value="notification.title" />
            </div>
          </div>
          <div class="text-xs text-slate-400">{{ notification.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
