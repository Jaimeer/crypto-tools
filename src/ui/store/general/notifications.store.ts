import { defineStore } from 'pinia'
import { Notification } from '../../../server/data.dto'

type VisibleNotification = Notification & { show: boolean; date: Date }

type State = {
  notifications: VisibleNotification[]
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
      this.notifications.unshift({
        ...notification,
        show: true,
        date: new Date(),
      })
      if (this.notifications.length > 50) this.notifications.pop()

      setTimeout(() => {
        const index = this.notifications.findIndex(
          (x: Notification) => x.id === notification.id,
        )
        // if (index !== -1) this.notifications[index].show = false
      }, 2000)
    },
    removeNotification(id: string) {
      const index = this.notifications.findIndex(
        (x: Notification) => x.id === id,
      )
      if (index !== -1) this.notifications[index].show = false
    },
  },
})
