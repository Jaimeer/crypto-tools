// eslint-disable-next-line import/no-unresolved
import WebSocket from 'ws'
import zlib from 'zlib'
import { BingxRestClient } from './BingxRest.client'
import { WebSocketMessage } from './Bingx.ws.dto'
import { LoggerService } from '../../utils/Logger'

export type HandleMessageFn = (message: WebSocketMessage) => void

const activeIntervals: Set<NodeJS.Timeout> = new Set()

export class BingxWebSocket {
  private readonly logger: LoggerService
  private readonly restClient: BingxRestClient
  private readonly handleMessageFn: HandleMessageFn
  private socket: WebSocket
  private listenKey: string

  constructor(restClient: BingxRestClient, handleMessageFn: HandleMessageFn) {
    this.logger = new LoggerService(BingxWebSocket.name)
    this.restClient = restClient
    this.handleMessageFn = handleMessageFn
    this.startSocket()
    // this.test();
  }

  updateListenKey() {
    this.logger.debug('TODO')
    this.startSocket(true)
  }

  async subscribe(socketId: string, channel: string) {
    this.logger.debug(`Subscribing to ${channel}`)
    await this.startSocket()
    const CHANNEL = {
      id: socketId,
      reqType: 'sub',
      dataType: channel,
    }
    this.socket.send(JSON.stringify(CHANNEL))
  }

  async unsubscribe(socketId: string, channel: string) {
    this.logger.debug(`Unsubscribing from ${channel}`)
    await this.startSocket()
    const CHANNEL = {
      id: socketId,
      reqType: 'unsub',
      dataType: channel,
    }
    this.socket.send(JSON.stringify(CHANNEL))
  }

  private onMessage(message: string) {
    if (!this.socket) {
      this.startSocket()
      return
    }
    const buf = Buffer.from(message)
    const decodedMsg = zlib.gunzipSync(buf).toString('utf-8')
    // this.logger.debug("onMessage", decodedMsg);
    if (decodedMsg === 'Ping') {
      this.socket.send('Pong')
      this.logger.debug('Pong')
      return
    }
    const messageData = JSON.parse(decodedMsg) as WebSocketMessage
    // this.logger.debug(
    //   "WS MSG: ",
    //   "dataType" in messageData
    //     ? messageData.dataType
    //     : "e" in messageData
    //       ? messageData.e
    //       : "unknown",
    //   new Date().toISOString(),
    // );
    this.handleMessageFn(messageData)
  }

  private onClose() {
    this.logger.debug('WebSocket closed')
    this.stop()
  }

  private startExtendKeyInterval() {
    this.logger.debug('>> startExtendKeyInterval')
    this.stopExtendKeyInterval()

    const refreshInterval = setInterval(
      async () => {
        try {
          this.logger.debug('>> extendKeyInterval')
          if (this.listenKey) {
            this.logger.debug('>> Extending WebSocket listen key')
            await this.restClient.extendWSListenKey(this.listenKey)
          }
        } catch (error) {
          console.error('>> Failed to extend WebSocket listen key:', error)
        }
      },
      30 * 60 * 1000,
    )

    activeIntervals.add(refreshInterval)

    this.logger.debug('>> WebSocket key extension scheduled every 30 minutes')
  }

  private stopExtendKeyInterval() {
    for (const interval of activeIntervals) {
      clearInterval(interval)
      activeIntervals.delete(interval)
      this.logger.debug('BingxWebSocket auto-refresh stopped')
    }
    this.logger.debug('BingxWebSocket key extension interval stopped')
  }

  stop() {
    this.stopExtendKeyInterval()
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) this.socket.close()
      this.socket = undefined
    }
  }

  private async startSocket(force = false) {
    // this.logger.debug("startSocket", { force });
    if (!this.socket || force) {
      this.stop()
      this.logger.debug('starting socket')
      if (!this.listenKey || force)
        this.listenKey = await this.restClient.getWSListenKey()
      const path = `wss://open-api-swap.bingx.com/swap-market?listenKey=${this.listenKey}`

      const startWS = new Promise((resolve, reject) => {
        this.socket = new WebSocket(path)
        this.socket.on('open', () => {
          this.logger.debug('WebSocket open')
          resolve(undefined)
        })
        this.socket.on('message', (message: string) => this.onMessage(message))
        this.socket.on('error', (error: Error) => {
          this.logger.debug(`WebSocket error: ${error.message}`)
          reject(error)
        })
        this.socket.on('close', () => this.onClose())
      })

      await startWS
      this.startExtendKeyInterval()
    }
  }
}
