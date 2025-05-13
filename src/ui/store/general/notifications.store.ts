import { defineStore } from 'pinia'
import { Notification } from '../../../server/data.dto'

type State = {
  notifications: Notification[]
  loading: boolean
  error: string | null
}

export const useNotificationsStore = defineStore('base-notifications', {
  state: (): State => ({
    notifications: [
      // {
      //   id: '1',
      //   title: 'Test Notification',
      //   message: 'This is a test notification',
      //   type: 'info',
      // },
      // {
      //   id: '2',
      //   title: 'Test Notification 2',
      //   message: 'This is a test notification 2',
      //   type: 'warning',
      // },
      // {
      //   id: '3',
      //   title: 'Test Notification 3',
      //   message: 'This is a test notification 3',
      //   type: 'error',
      // },
    ],
    loading: false,
    error: null,
  }),

  actions: {
    processMessage(notification: Notification) {
      this.notifications.push(notification)
      setTimeout(() => {
        this.notifications = this.notifications.filter(
          (x: Notification) => x.id !== notification.id,
        )
      }, 2000)
    },
  },
})
