import axios, { Axios } from 'axios'
import { CookieJar } from 'tough-cookie'
import { BrowserWindow } from 'electron'
import {
  BitkuaAction,
  BitkuaActionDelete,
  BitkuaActionReset,
  BitkuaActionUpdateAmount,
  BitkuaActionUpdateSafe,
  BitkuaActionUpdateStatus,
  BitkuaActionUpdateStrategy,
} from './Bitkua.dto'
import { NotifyMessage } from '../messages.dto'
import { BitkuaBot, Bot } from '../data.dto'

export class BitkuaService {
  private username: string
  private token: string
  private refreshInterval: NodeJS.Timeout | null = null
  private client: Axios

  private jar = new CookieJar()

  constructor(username: string, token: string) {
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

    this.refreshInterval = setInterval(async () => {
      try {
        await this.getBots()
      } catch (error) {
        console.error('BitkuaService auto-refresh failed:', error)
      }
    }, intervalMs)

    console.log(
      `BitkuaService auto-refresh started: every ${intervalMs / 1000} seconds`,
    )
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      console.log('BitkuaService auto-refresh stopped')
    }
  }

  async processAction(message: BitkuaAction) {
    switch (message.action) {
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
      console.log('Fetching dk-bots...')
      const response = await this.client.request<{
        success: boolean
        data: BitkuaBot[]
      }>({
        method: 'GET',
        data: {
          action: 'info_bots',
          username: this.username,
          token: this.token,
        },
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

      console.log('Scraped bot data:', bots.length)

      this.notifyClients({
        store: 'bots',
        bots: bots.toSorted((a, b) => a.symbol.localeCompare(b.symbol)),
      })
    } catch (error) {
      console.error('Error during login process:', error)
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
      console.log('Bot status updated successfully:', message.botId)
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
      console.log('Bot safe  updated successfully:', message.botId)
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
      console.log('Bot strategy updated successfully:', message.botId)
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
      console.log('Bot amount updated successfully:', message.botId)
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
      console.log('Bot deleted successfully:', message.botId)
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
      console.log('Bot reset successfully:', message.symbol)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error resetting bot:', error.message)
    }
  }

  private notifyClients(message: NotifyMessage) {
    // console.log("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`update-data`, message)
      }
    })
  }
}
