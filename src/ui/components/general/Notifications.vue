<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationsStore } from '../../store/general/notifications.store'

const notificationsStore = useNotificationsStore()

const filteredNotifications = computed(() => {
  return notificationsStore.notifications.filter((notification) => {
    return notification.show
  })
})

const createSample = () => {
  notificationsStore.processMessage({
    title: 'Sample Notification',
    message: 'This is a sample notification message.',
    type: 'info',
    action: 'Sample Action',
  })
}
</script>

<template>
  <div class="fixed top-4 right-0 z-40 flex flex-col gap-3">
    <!-- <div
      class="cursor-pointer rounded bg-red-600 px-4 py-2 hover:bg-red-800"
      @click="createSample"
    >
      createSample
    </div> -->
    <div
      v-for="notification in filteredNotifications"
      :key="notification.id"
      class="flex w-72 items-center justify-between rounded rounded-r-none border border-slate-500 p-2 transition"
      :class="{
        'bg-red-300 text-red-900': notification.type === 'error',
        'bg-yellow-300 text-yellow-900': notification.type === 'warning',
        'bg-green-300 text-green-900': notification.type === 'success',
        'bg-slate-300 text-slate-900': notification.type === 'info',
      }"
    >
      <div class="flex flex-col">
        <div class="text-sm font-bold">{{ notification.title }}</div>
        <div class="text-xs">{{ notification.message }}</div>
      </div>
      <div
        class="cursor-pointer text-sm text-slate-900 hover:opacity-80"
        @click="notificationsStore.removeNotification(notification.id)"
      >
        X
      </div>
    </div>
    <!-- <pre class="bg-slate-800">{{ filteredNotifications }}</pre> -->
  </div>
</template>
