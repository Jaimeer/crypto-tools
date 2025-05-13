import { BrowserWindow } from 'electron'
import { LoggerService } from '../utils/Logger'
import { NotifyMessage } from './messages.dto'
import { Notification } from './data.dto'

export class NotificationService {
  private readonly logger: LoggerService

  constructor() {
    this.logger = new LoggerService(NotificationService.name)
  }

  sendNotification(message: Omit<Notification, 'id'>) {
    this.notifyClients({
      store: 'notifications',
      notification: { ...message, id: Date.now().toString() },
    })
  }

  private notifyClients(message: NotifyMessage) {
    // this.logger.debug("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`update-data`, message)
      }
    })
  }
}
