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
    api: 'Test',
    action: 'Sample Action',
    type: 'info',
    title: 'Sample Notification',
    message: 'This is a sample notification message.',
  })
  notificationsStore.processMessage({
    api: 'Test',
    action: 'Sample Action',
    type: 'success',
    title: 'Sample Notification',
    message: 'This is a sample notification message.',
  })
  notificationsStore.processMessage({
    api: 'Test',
    action: 'Sample Action',
    type: 'warning',
    title: 'Sample Notification',
    message: 'This is a sample notification message.',
  })
  notificationsStore.processMessage({
    api: 'Test',
    action: 'Sample Action',
    type: 'error',
    title: 'Sample Notification',
    message: 'This is a sample notification message.',
  })
  notificationsStore.processMessage({
    api: 'Test',
    action: 'Sample Action',
    type: 'info',
    title: 'Sample Notification',
    message: 'This is a sample notification message.',
    metadata: {
      exchange: 'bitget',
      symbol: 'BTC/USDT',
      side: 'LONG',
      price: '10000',
      amount: '10',
    },
  })
}
</script>

<template>
  <div
    class="cursor-pointer rounded bg-red-600 px-4 py-2 hover:bg-red-800"
    @click="createSample"
  >
    Create Sample Notifications
  </div>
</template>
