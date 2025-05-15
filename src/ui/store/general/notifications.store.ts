import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { Notification } from '../../../server/data.dto'

type VisibleNotification = Notification & {
  id: string
  show: boolean
  date: Date
}

type State = {
  notifications: VisibleNotification[]
  loading: boolean
  error: string | null
}

export const useNotificationsStore = defineStore('notifications', {
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
      const notificationId = nanoid()
      this.notifications.unshift({
        ...notification,
        show: true,
        date: new Date(),
        id: notificationId,
      })
      if (this.notifications.length > 50) this.notifications.pop()

      setTimeout(() => {
        this.removeNotification(notificationId)
      }, 2000)
    },
    removeNotification(id: string) {
      const index = this.notifications.findIndex(
        (x: VisibleNotification) => x.id === id,
      )
      if (index !== -1) {
        // Create a new notification object with show:false
        const updatedNotification = {
          ...this.notifications[index],
          show: false,
        }

        // Replace the entire array with an updated copy
        this.notifications = [
          ...this.notifications.slice(0, index),
          updatedNotification,
          ...this.notifications.slice(index + 1),
        ]
      }
    },
  },
})
