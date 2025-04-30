import axios, { Axios } from 'axios'
import * as cheerio from 'cheerio'
import { authenticator } from 'otplib'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import { BrowserWindow } from 'electron'
import { BitkuaAction, BitkuaActionUpdateStatus } from './Bitkua.dto'
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
        await this.updateBotStatus(message)
        break
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
    // Create axios instance using the same cookie jar

    try {
      const response = await this.client.request<{
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
      console.log(response.status)
      console.log(response.data)
      console.log('Bot status updated successfully:', message.botId)
      this.startAutoRefresh()
    } catch (error) {
      console.error('Error updating bot status:', error.message)
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
