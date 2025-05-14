import axios, { Axios } from 'axios'
import { BrowserWindow } from 'electron'
import {
  BitkuaAction,
  BitkuaActionCreateBot,
  BitkuaActionDelete,
  BitkuaActionReset,
  BitkuaActionUpdateAmount,
  BitkuaActionUpdateSafe,
  BitkuaActionUpdateStatus,
  BitkuaActionUpdateStrategy,
  BitkuaDataMarket,
  BitkuaSecurityToken,
} from './Bitkua.dto'
import { NotifyMessage } from '../messages.dto'
import {
  BitkuaBot,
  BitkuaStrategy,
  Bot,
  DataMarket,
  SecurityToken,
  Strategy,
} from '../data.dto'
import { LoggerService } from '../../utils/Logger'
import { NotificationService } from '../Notification.service'

const activeIntervals: Set<NodeJS.Timeout> = new Set()

export class BitkuaService {
  private readonly notification: NotificationService
  private readonly logger: LoggerService
  private username: string
  private token: string
  private client: Axios

  constructor(username: string, token: string) {
    this.logger = new LoggerService(BitkuaService.name)
    this.notification = new NotificationService()
    this.username = username
    this.token = token
    this.client = axios.create({
      baseURL: 'https://www.bitkua.com/apiv4/',
    })
  }

  setCredentials(username: string, token: string) {
    this.username = username
    this.token = token
  }

  private async getData() {
    await Promise.all([
      this.getBots(),
      this.getStrategies(),
      this.getDataMarket(),
      this.getSecurityTokens(),
    ])
  }

  async startAutoRefresh(intervalMs = 60000) {
    this.stopAutoRefresh()
    await this.getData()

    const refreshInterval = setInterval(async () => {
      try {
        await this.getData()
      } catch (error) {
        console.error('BitkuaService auto-refresh failed:', error)
      }
    }, intervalMs)

    activeIntervals.add(refreshInterval)

    this.logger.debug(
      `BitkuaService auto-refresh started: every ${intervalMs / 1000} seconds`,
    )
  }

  stopAutoRefresh() {
    for (const interval of activeIntervals) {
      clearInterval(interval)
      activeIntervals.delete(interval)
      this.logger.debug('BitkuaService auto-refresh stopped')
    }
  }

  async processAction(message: BitkuaAction) {
    switch (message.action) {
      case 'createBot':
        return this.createBot(message)
      case 'updateStatus':
        return this.updateBotStatus(message)
      case 'updateSafe':
        return this.updateBotSafe(message)
      case 'updateStrategy':
        return this.updateBotStrategy(message)
      case 'updateAmount':
        return this.updateBotAmount(message)
      case 'delete':
        return this.deleteBot(message)
      case 'reset':
        return this.resetBot(message)
      default:
        break
    }
  }

  private async getDataEntity<B, R>(
    action: 'info_bots' | 'check_estrategias' | 'data_market' | 'tokens',
    transformerFn: (items: B) => R,
  ) {
    try {
      this.logger.debug(`Fetching action ${action}...`)
      const data = {
        action,
        username: this.username,
        clave: this.token,
      }

      const response = await this.client.request<{
        success: boolean
        data: B[]
      }>({
        method: 'GET',
        data,
      })

      const responseData = response.data

      if (!responseData.success || !responseData.data) {
        console.warn(response.data)
        this.notification.sendNotification({
          type: 'error',
          title: 'BingX',
          action,
          message: `Error fetching: ${responseData.data.toString()}`,
        })
        return
      }

      const items = responseData.data.map((item) => transformerFn(item))

      this.logger.debug(`Fetched ${action}: ${items.length}`)
      return items
    } catch (error) {
      console.error(`Error fetching ${action}:`, error.message)
      this.notification.sendNotification({
        type: 'error',
        title: 'BingX',
        action,
        message: `Error fetching: ${error.message}`,
      })
    }
  }

  private async getBots() {
    const items = await this.getDataEntity<BitkuaBot, Bot>(
      'info_bots',
      (item) => ({
        id: item.id.toString(),
        securityToken: item.security_token,
        symbol: item.symbol.replace('-', ''),
        amount: item.amount,
        status: item.active,
        strategy: item.estrategia,
        positionSide: item.positionside,
        exchange: item.exchange,
        count: item.count,
        safe: item.safe === 'yes',
        createdAt: new Date(item.created_at),
      }),
    )

    this.notifyClients({
      store: 'bots',
      bots: items.toSorted((a, b) => a.symbol.localeCompare(b.symbol)),
    })
  }

  private async getStrategies() {
    const items = await this.getDataEntity<BitkuaStrategy, Strategy>(
      'check_estrategias',
      (item) => ({
        id: item.id.toString(),
        slug: item.slug,
        name: item.name,
        positionside: item.positionside,
      }),
    )

    this.notifyClients({
      store: 'strategies',
      strategies: items.toSorted((a, b) => a.name.localeCompare(b.name)),
    })
  }

  async getDataMarket() {
    const items = await this.getDataEntity<BitkuaDataMarket, DataMarket>(
      'data_market',
      (item) => ({
        symbol: item.symbol.replace('-', ''),
        exchange: item.exchange,
        price: parseFloat(item.price),
        sma55: parseFloat(item.sma55),
        sma55_1d: parseFloat(item.sma55_1d),
        maxD: parseFloat(item.maximoD),
        minD: parseFloat(item.minimoD),
        pmd: parseFloat(item.pmd),
        max15_1h: parseFloat(item.max15_1h),
        min15_1h: parseFloat(item.min15_1h),
        higherRange: parseFloat(item.rangoSuperior),
        lowerRange: parseFloat(item.rangoInferior),
        liqMax: parseFloat(item.LiqMax),
        liqMin: parseFloat(item.LiqMin),
        fomo:
          parseFloat(item.minimoD) > 0
            ? ((parseFloat(item.price) - parseFloat(item.minimoD)) /
                parseFloat(item.minimoD)) *
              100
            : 0,
        fud:
          parseFloat(item.maximoD) > 0
            ? ((parseFloat(item.maximoD) - parseFloat(item.price)) /
                parseFloat(item.maximoD)) *
              100
            : 0,
        ratioFvdMc: parseFloat(item.ratio_fvd_mc),
      }),
    )

    this.notifyClients({
      store: 'dataMarket',
      dataMarket: items,
    })
  }

  async getSecurityTokens() {
    const items = await this.getDataEntity<BitkuaSecurityToken, SecurityToken>(
      'tokens',
      (item) => ({
        tokenId: item.idtokens,
        securityToken: item.security_token,
        exchange: item.exchange,
      }),
    )

    this.notifyClients({
      store: 'securityTokens',
      securityTokens: items,
    })
  }

  private async executeBotAction(
    data: Record<string, unknown> & {
      action: string
      symbol?: string
      exchange?: string
      estrategia?: string
      positionside?: string
    },
    botId?: string,
  ) {
    let prefix = ''
    if (data.symbol) prefix += `[${data.symbol}]`
    if (data.exchange) prefix += `[${data.exchange}]`
    if (data.estrategia) prefix += `[${data.estrategia}]`
    if (data.positionside) prefix += `[${data.positionside}]`

    try {
      const response = await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'POST',
        data,
      })

      if (!response.data.success) {
        console.log(response.data)
        this.logger.warn(
          `Bitkua error ${data.action}: ${response.data.data.toString()}`,
        )
        this.notification.sendNotification({
          type: 'error',
          title: 'BingX',
          action: data.action,
          message: `${prefix} Error: ${response.data.toString()}`.trim(),
        })
      } else {
        this.logger.debug(`Bot ${data.action} successfully: ${botId}`)
        this.notification.sendNotification({
          type: 'success',
          title: 'BingX',
          action: data.action,
          message: `${prefix} Successfully`.trim(),
        })
      }
      this.startAutoRefresh()
    } catch (error) {
      console.error(`Error ${data.action}:`, error.message)
      this.notification.sendNotification({
        type: 'error',
        title: 'BingX',
        action: data.action,
        message: `${prefix} Error: ${error.message}`.trim(),
      })
    }
  }

  private async updateBotStatus(message: BitkuaActionUpdateStatus) {
    await this.executeBotAction(
      {
        action: 'update_status',
        username: this.username,
        clave: this.token,
        id: message.botId,
        status: message.status,
      },
      message.botId,
    )
  }

  private async updateBotSafe(message: BitkuaActionUpdateSafe) {
    await this.executeBotAction(
      {
        action: 'update_safe',
        username: this.username,
        clave: this.token,
        id: message.botId,
        safe: message.safe ? 'yes' : 'no',
      },
      message.botId,
    )
  }

  private async updateBotStrategy(message: BitkuaActionUpdateStrategy) {
    await this.executeBotAction(
      {
        action: 'update_estrategia',
        username: this.username,
        clave: this.token,
        id: message.botId,
        estrategia: message.strategy,
      },
      message.botId,
    )
  }

  private async updateBotAmount(message: BitkuaActionUpdateAmount) {
    await this.executeBotAction(
      {
        action: 'update_amount',
        username: this.username,
        clave: this.token,
        id: message.botId,
        amount: message.amount,
      },
      message.botId,
    )
  }

  private async deleteBot(message: BitkuaActionDelete) {
    await this.executeBotAction(
      {
        action: 'delete',
        username: this.username,
        clave: this.token,
        id: message.botId,
      },
      message.botId,
    )
  }

  private async resetBot(message: BitkuaActionReset) {
    await this.executeBotAction(
      {
        action: 'reset',
        username: this.username,
        clave: this.token,
        id: message.botId,
        symbol: message.symbol,
      },
      message.botId,
    )
  }

  private async createBot(message: BitkuaActionCreateBot) {
    if (message.long) {
      await this.executeBotAction({
        action: 'create_bots',
        username: this.username,
        clave: this.token,
        symbol: message.symbol,
        idtokens: message.tokenId,
        amount: message.amount,
        active: message.status,
        exchange: message.exchange,
        estrategia: message.strategy,
        positionside: 'LONG',
        count: 0,
        safe: message.safe ? 'yes' : 'no',
      })
    }

    if (message.short && message.strategy !== 'infinity') {
      await this.executeBotAction({
        action: 'create_bots',
        username: this.username,
        clave: this.token,
        symbol: message.symbol,
        idtokens: message.tokenId,
        amount: message.amount,
        active: message.status,
        exchange: message.exchange,
        estrategia: `short${message.strategy}`,
        positionside: 'SHORT',
        count: 0,
        safe: message.safe ? 'yes' : 'no',
      })
    }
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
