import axios, { Axios } from 'axios'
import { CookieJar } from 'tough-cookie'
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
} from './Bitkua.dto'
import { NotifyMessage } from '../messages.dto'
import { BitkuaBot, Bot, DataMarket } from '../data.dto'
import { LoggerService } from '../../utils/Logger'

const activeIntervals: Set<NodeJS.Timeout> = new Set()

export class BitkuaService {
  private readonly logger: LoggerService
  private username: string
  private token: string
  private client: Axios

  private jar = new CookieJar()

  constructor(username: string, token: string) {
    this.logger = new LoggerService(BitkuaService.name)
    this.username = username
    this.token = token
    this.client = axios.create({
      baseURL: 'https://www.bitkua.com/apiv3/',
    })
  }

  setCredentials(username: string, token: string) {
    this.username = username
    this.token = token
  }

  async startAutoRefresh(intervalMs = 60000) {
    this.stopAutoRefresh()
    await this.getBots()
    await this.getDataMarket()

    const refreshInterval = setInterval(async () => {
      try {
        await this.getBots()
        await this.getDataMarket()
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

  private async getBots() {
    try {
      this.logger.debug('Fetching dk-bots...')
      const data = {
        action: 'info_bots',
        username: this.username,
        token: this.token,
      }

      const response = await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'GET',
        data,
      })

      const bitkuaBots = response.data

      if (!bitkuaBots.success || !bitkuaBots.data) return

      const bots: Bot[] = bitkuaBots.data.map((bot) => ({
        id: bot.id.toString(),
        symbol: bot.symbol.replace('-', ''),
        amount: bot.amount,
        status: bot.active,
        strategy: bot.estrategia,
        positionSide: bot.positionside,
        exchange: bot.exchange,
        count: bot.count,
        safe: bot.safe === 'yes',
        createdAt: new Date(bot.created_at),
      }))

      this.logger.debug(`Scraped bot data: ${bots.length}`)

      this.notifyClients({
        store: 'bots',
        bots: bots.toSorted((a, b) => a.symbol.localeCompare(b.symbol)),
      })
    } catch (error) {
      console.error('Error during login process:', error)
    }
  }

  async getDataMarket() {
    try {
      this.logger.debug('Fetching dk-data-market...')
      const data = {
        action: 'data_market',
        username: this.username,
        token: this.token,
      }

      const response = await this.client.request<{
        success: boolean
        data: BitkuaDataMarket[]
      }>({
        method: 'GET',
        data,
      })

      const bitkuaDataMarket = response.data

      if (!bitkuaDataMarket.success || !bitkuaDataMarket.data) return

      const dataMarket: DataMarket[] = bitkuaDataMarket.data.map(
        (dataMarket) => ({
          symbol: dataMarket.symbol.replace('-', ''),
          exchange: dataMarket.exchange,
          price: parseFloat(dataMarket.price),
          sma55: parseFloat(dataMarket.sma55),
          sma55_1d: parseFloat(dataMarket.sma55_1d),
          maxD: parseFloat(dataMarket.maximoD),
          minD: parseFloat(dataMarket.minimoD),
          pmd: parseFloat(dataMarket.pmd),
          max15_1h: parseFloat(dataMarket.max15_1h),
          min15_1h: parseFloat(dataMarket.min15_1h),
          higherRange: parseFloat(dataMarket.rangoSuperior),
          lowerRange: parseFloat(dataMarket.rangoInferior),
          liqMax: parseFloat(dataMarket.LiqMax),
          liqMin: parseFloat(dataMarket.LiqMin),
          fomo:
            parseFloat(dataMarket.minimoD) > 0
              ? ((parseFloat(dataMarket.price) -
                  parseFloat(dataMarket.minimoD)) /
                  parseFloat(dataMarket.minimoD)) *
                100
              : 0,
          fud:
            parseFloat(dataMarket.maximoD) > 0
              ? ((parseFloat(dataMarket.maximoD) -
                  parseFloat(dataMarket.price)) /
                  parseFloat(dataMarket.maximoD)) *
                100
              : 0,
          ratioFvdMc: parseFloat(dataMarket.ratio_fvd_mc),
        }),
      )

      this.logger.debug(`Fetch dataMarket data: ${dataMarket.length}`)

      this.notifyClients({
        store: 'dataMarket',
        dataMarket: dataMarket,
      })
    } catch (error) {
      console.error('Error during data market fetch:', error)
    }
  }

  private async updateBotStatus(message: BitkuaActionUpdateStatus) {
    try {
      await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'POST',
        data: {
          action: 'update_status',
          username: this.username,
          token: this.token,
          id: message.botId,
          status: message.status,
        },
      })
      this.logger.debug(`Bot status updated successfully: ${message.botId}`)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error updating bot status:', error.message)
    }
  }

  private async updateBotSafe(message: BitkuaActionUpdateSafe) {
    try {
      await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'POST',
        data: {
          action: 'update_safe',
          username: this.username,
          token: this.token,
          id: message.botId,
          safe: message.safe ? 'yes' : 'no',
        },
      })
      this.logger.debug(`Bot safe  updated successfully: ${message.botId}`)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error updating bot safe:', error.message)
    }
  }

  private async updateBotStrategy(message: BitkuaActionUpdateStrategy) {
    try {
      await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'POST',
        data: {
          action: 'update_estrategia',
          username: this.username,
          token: this.token,
          id: message.botId,
          estrategia: message.strategy,
        },
      })
      this.logger.debug(`Bot strategy updated successfully: ${message.botId}`)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error updating bot strategy:', error.message)
    }
  }

  private async updateBotAmount(message: BitkuaActionUpdateAmount) {
    try {
      await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'POST',
        data: {
          action: 'update_amount',
          username: this.username,
          token: this.token,
          id: message.botId,
          amount: message.amount,
        },
      })
      this.logger.debug(`Bot amount updated successfully: ${message.botId}`)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error updating bot amount:', error.message)
    }
  }

  private async deleteBot(message: BitkuaActionDelete) {
    try {
      await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'POST',
        data: {
          action: 'delete',
          username: this.username,
          token: this.token,
          id: message.botId,
        },
      })
      this.logger.debug(`Bot deleted successfully: ${message.botId}`)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error deleting bot:', error.message)
    }
  }

  private async resetBot(message: BitkuaActionReset) {
    try {
      await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'POST',
        data: {
          action: 'reset',
          username: this.username,
          token: this.token,
          symbol: message.symbol,
          positionSide: message.positionSide,
        },
      })
      this.logger.debug(`Bot reset successfully: ${message.symbol}`)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error resetting bot:', error.message)
    }
  }

  private async createBot(message: BitkuaActionCreateBot) {
    try {
      if (message.long) {
        const data = {
          action: 'create_bots',
          username: this.username,
          token: this.token,
          symbol: message.symbol,
          security_token: this.token,
          amount: message.amount,
          active: message.status,
          exchange: message.exchange,
          estrategia: message.strategy,
          positionside: 'LONG',
          count: 0,
          safe: message.safe ? 'yes' : 'no',
        }
        console.log(data)
        await this.client.request<{
          success: boolean
          data: BitkuaBot[]
        }>({
          method: 'POST',
          data,
        })
        this.logger.debug(`Long bot created successfully: ${message.symbol}`)
      }

      if (message.short && message.strategy !== 'infinity') {
        const data = {
          action: 'create_bots',
          username: this.username,
          token: this.token,
          symbol: message.symbol,
          security_token: this.token,
          amount: message.amount,
          active: message.status,
          exchange: message.exchange,
          estrategia: `short${message.strategy}`,
          positionside: 'SHORT',
          count: 0,
          safe: message.safe ? 'yes' : 'no',
        }
        console.log(data)

        await this.client.request<{
          success: boolean
          data: BitkuaBot[]
        }>({
          method: 'POST',
          data,
        })
        this.logger.debug(`Short bot created successfully: ${message.symbol}`)
      }

      this.startAutoRefresh()
    } catch (error) {
      console.error('Error resetting bot:', error.message)
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
