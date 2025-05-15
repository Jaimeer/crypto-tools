import { BrowserWindow } from 'electron'
import { NotifyMessage } from '../messages.dto'
import {
    Balance,
    Contract,
    KLine,
    Period,
    Position,
    Trade,
    Transaction,
} from '../data.dto'
import { KucoinRestClient, KucoinSdkFuturesAccountOverview } from './KucoinRest.client'
//import { FuturesAccountBillV2, FuturesOrderFillV2 } from 'bitget-api'
import { KucoinCacheService } from './Kucoin.cache'
import { CacheService } from '../Cache.service'
import { KucoinTransformer } from './Kucoin.transformer'
import { LoggerService } from '../../utils/Logger'
import { ExchangeService } from '../base/Exchange.service'
import { ObjectSize } from '../../utils/ObjectSize'

export class KucoinService {
    private restClient: KucoinRestClient
    private logger: LoggerService
    private cacheService: KucoinCacheService
    private originalData: {
        transactions: Transaction[]
        trades: Trade[]
    } = {
            transactions: [],
            trades: [],
        }
    private data: {
        transactions: any[]
        trades: any[]
        balance: Balance | undefined
        positions: Position[]
    } = {
            transactions: [],
            trades: [],
            balance: undefined,
            positions: [],
        }

    constructor(apiKey: string, apiSecret: string, passphrase?: string) {
        this.logger = new LoggerService(KucoinService.name)
        this.restClient = new KucoinRestClient(apiKey, apiSecret, passphrase)
        this.cacheService = new KucoinCacheService(new CacheService())
        if (apiKey && apiSecret && passphrase) {
            this.cacheService.setHashCode(apiKey + apiSecret + passphrase)
        }
    }

    async loadData(): Promise<void> {
        this.logger.debug('Cargando datos de balance y posiciones de Kucoin...')
        // Cargar transacciones y trades de la API y la caché, igual que en Bitget
        // if (!this.originalData.transactions.length) {
        //     const cachedData = await this.cacheService.loadKucoinTransactions()
        //     this.originalData.transactions = cachedData?.data ?? []
        //     this.logger.debug(`Cache transactions ${this.originalData.transactions.length}`)
        // }
        // if (!this.originalData.trades.length) {
        //     const cachedData = await this.cacheService.loadKucoinTrades()
        //     this.originalData.trades = cachedData?.data ?? []
        //     this.logger.debug(`Cache trades ${this.originalData.trades.length}`)
        // }

        // Obtener datos nuevos de la API y actualizar la caché
        // const apiTransactions = await this.restClient.fetchTransactions()
        // //const apiTrades = await this.restClient.fetchTrades()
        // if (apiTransactions.length) {
        //     this.originalData.transactions = apiTransactions
        //     await this.cacheService.saveKucoinTransactions(apiTransactions)
        // }
        //if (apiTrades.length) {
        //    this.originalData.trades = apiTrades
        //    await this.cacheService.saveKucoinTrades(apiTrades)
        //}

        const sdkBalance = await this.restClient.fetchBalance()
        const sdkPositions = await this.restClient.fetchPositions()

        //this.data.transactions = KucoinTransformer.transactionsTransform(this.originalData.transactions)
        //En Kucoin el campo que se repite es el orderId. 
        //this.data.trades = KucoinTransformer.tradesTransform(this.originalData.trades)
        this.data.balance = KucoinTransformer.balanceTransform(sdkBalance as any)
        this.data.positions = KucoinTransformer.positionsTransform(sdkPositions ?? [])

        // this.notifyClients({
        //     store: 'kucoin.transactions',
        //     transactions: this.data.transactions,
        // })
        // this.notifyClients({
        //     store: 'kucoin.trades',
        //     trades: this.data.trades,
        // })
        this.notifyClients({ store: 'kucoin.balance', balance: this.data.balance })
        this.notifyClients({ store: 'kucoin.positions', positions: this.data.positions })
    }

    startAutoRefresh(intervalMs = 60000): void {
        this.stopAutoRefresh()
        this.loadData()
        this.refreshInterval = setInterval(async () => {
            try {
                await this.loadData()
            } catch (error) {
                this.logger.error('KucoinService auto-refresh failed:' + error)
            }
        }, intervalMs)
        this.logger.debug(`KucoinService auto-refresh started: every ${intervalMs / 1000} seconds`)
    }

    stopAutoRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval)
            this.refreshInterval = null
            this.logger.debug('Auto-refresh detenido')
        }
    }

    private notifyClients(message: NotifyMessage) {
        BrowserWindow.getAllWindows().forEach((window) => {
            if (!window.isDestroyed()) {
                window.webContents.send('update-data', message)
            }
        })
    }

    private refreshInterval: NodeJS.Timeout | null = null
}