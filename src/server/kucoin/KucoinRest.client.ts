import {
  DefaultClient,
  ClientOptionBuilder,
  AccountService,
  GlobalFuturesApiEndpoint,
  TransportOptionBuilder,
  Futures,
  FuturesService,
  Account as AccountModule,
} from 'kucoin-universal-sdk'
import { LoggerService } from '../../utils/Logger'
import {
  KucoinBalance,
  KucoinContract,
  KucoinKLine,
  KucoinPosition,
  KucoinTrade,
  KucoinTransaction,
} from './Kucoin.dto'
import { HashLib } from '../../utils/HashLib'
import { ExchangeRestService } from '../base/ExchangeRest.service'
import { Period } from '../data.dto'

export interface KucoinSdkPosition {
  id: string
  symbol: string
  crossMode: boolean
  currentQty: number
  unrealisedPnl: number
  realisedPnl: number
  posInit: number
  posMargin: number
  avgEntryPrice: number
  liquidationPrice: number
  leverage: number
  markValue: number
  markPrice: number
  delevPercentage: number
  unrealisedRoePcnt: number
  openingTimestamp: number
  currentTimestamp: number
  code: string // Código de respuesta (no en la posición, usar predeterminado)
  currentCost: number
  currentComm: number
  unrealisedCost: number
  posCost: number
  openCost: number // No en la respuesta, usar predeterminado
  fundingCost: number // No en la respuesta, usar predeterminado
  realisedCost: number // No en la respuesta, usar predeterminado
  autoDeposit: boolean
  maintainMargin: number
  marginMode: 'ISOLATED' | 'CROSS'
  riskLimit: number
  adlLevel: number // No en la respuesta, usar predeterminado
  posStatus: string // No en la respuesta, inferir de isOpen
  tradeType: string // No en la respuesta, usar predeterminado
}

export interface KucoinSdkFuturesAccountOverview {
  accountEquity: number
  unrealisedPNL: number
  marginBalance: number
  positionMargin: number
  orderMargin: number
  frozenFunds: number
  availableBalance: number
  currency: string
  riskRatio: number
}

export class KucoinRestClient
  implements
    ExchangeRestService<
      KucoinTransaction,
      KucoinTrade,
      KucoinBalance,
      KucoinContract,
      KucoinPosition,
      KucoinKLine
    >
{
  private readonly logger: LoggerService
  private client: DefaultClient
  private accountService: AccountService
  private positionsService: FuturesService
  private API_KEY: string
  private API_SECRET: string
  private PASSPHRASE: string

  constructor(apiKey: string, apiSecret: string, passphrase?: string) {
    this.logger = new LoggerService(KucoinRestClient.name)
    this.API_KEY = apiKey
    this.API_SECRET = apiSecret
    this.PASSPHRASE = passphrase

    this.setup()
  }

  async fetchTrades(currentTrades: KucoinTrade[]): Promise<KucoinTrade[]> {
    return []
  }

  async fetchContracts(): Promise<KucoinContract[]> {
    return []
  }
  async fetchKLines(symbol: string, period: Period): Promise<KucoinKLine[]> {
    return []
  }
  async getWSListenKey(): Promise<string> {
    return ''
  }
  async extendWSListenKey(listenKey: string): Promise<void> {}

  setup() {
    const httpTransportOption = new TransportOptionBuilder()
      .setKeepAlive(true)
      .setMaxConnsPerHost(10)
      .setMaxIdleConns(10)
      .build()

    const clientOption = new ClientOptionBuilder()
      .setKey(this.API_KEY)
      .setSecret(this.API_SECRET)
      .setPassphrase(this.PASSPHRASE || '')
      .setFuturesEndpoint(GlobalFuturesApiEndpoint)
      .setTransportOption(httpTransportOption)
      .build()

    this.client = new DefaultClient(clientOption)
    this.accountService = this.client.restService().getAccountService()
    this.positionsService = this.client.restService().getFuturesService()
  }

  setCredentials(apiKey: string, apiSecret: string, passphrase: string) {
    this.API_KEY = apiKey
    this.API_SECRET = apiSecret
    this.PASSPHRASE = passphrase

    this.setup()
  }

  get hashCode() {
    return HashLib.generateHash(
      JSON.stringify({
        API_KEY: this.API_KEY,
        API_SECRET: this.API_SECRET,
        PASSPHRASE: this.PASSPHRASE,
      }),
    )
  }

  async fetchBalance(): Promise<KucoinSdkFuturesAccountOverview | undefined> {
    try {
      const req = AccountModule.Account.GetFuturesAccountReq.builder()
        .setCurrency('USDT')
        .build()

      const response = await this.accountService
        .getAccountApi()
        .getFuturesAccount(req)

      if (response && 'availableBalance' in response) {
        const {
          accountEquity,
          unrealisedPNL,
          marginBalance,
          positionMargin,
          orderMargin,
          frozenFunds,
          availableBalance,
          currency,
          riskRatio,
        } = response
        const cleanBalance: KucoinSdkFuturesAccountOverview = {
          accountEquity,
          unrealisedPNL,
          marginBalance,
          positionMargin,
          orderMargin,
          frozenFunds,
          availableBalance,
          currency,
          riskRatio,
        }
        this.logger.debug('Balance obtenido')
        return cleanBalance
      }
      this.logger.warn('No se encontraron datos de balance en la respuesta')
      return undefined
    } catch (error) {
      this.logger.error(
        `Error al obtener balance de cuenta: ${error.message} - Stack: ${error.stack}`,
      )
      if (error.response) {
        this.logger.error(
          `Detalles del error HTTP: Status=${error.response.status}, Data=${JSON.stringify(error.response.data)}`,
        )
      }
      return undefined
    }
  }

  async fetchTransactions(): Promise<any[]> {
    //en Kucoin las transactions es el historial de posiciones
    this.logger.debug('Obteniendo Transactions de KuCoin Futures...')
    try {
      const req = Futures.Positions.GetPositionListReq.builder().build()
      const response = await this.positionsService
        .getPositionsApi()
        .getPositionList(req)

      this.logger.debug(
        'Respuesta cruda getPositionList:' + JSON.stringify(response.data),
      )
      return response?.data ?? []
    } catch (error) {
      this.logger.error(
        `Error al obtener posiciones: ${error.message} - Stack: ${error.stack}`,
      )
      return []
    }
  }

  async fetchPositions(): Promise<any[]> {
    this.logger.debug('Obteniendo posiciones de KuCoin Futures...')
    try {
      const req = Futures.Positions.GetPositionListReq.builder().build()
      const response = await this.positionsService
        .getPositionsApi()
        .getPositionList(req)
      //this.logger.debug('Respuesta cruda getPositionList:' + JSON.stringify(response.data));
      if (response.data && Array.isArray(response.data)) {
        const cleanPositions: KucoinSdkPosition[] = response.data.map(
          (pos: any) => ({
            id: pos.id,
            symbol: pos.symbol,
            crossMode: pos.crossMode,
            currentQty: pos.currentQty,
            unrealisedPnl: pos.unrealisedPnl,
            realisedPnl: pos.realisedPnl,
            posInit: pos.posInit,
            posMargin: pos.posMargin,
            avgEntryPrice: pos.avgEntryPrice,
            liquidationPrice: pos.liquidationPrice,
            leverage: pos.leverage,
            markValue: pos.markValue,
            markPrice: pos.markPrice,
            delevPercentage: pos.delevPercentage,
            unrealisedRoePcnt: pos.unrealisedRoePcnt,
            openingTimestamp: pos.openingTimestamp,
            currentTimestamp: pos.currentTimestamp,
            code: '0', // de momento no hay codigo de respuesta, usar 0 por ahora
            currentCost: pos.currentCost,
            currentComm: pos.currentComm,
            unrealisedCost: pos.unrealisedCost,
            posCost: pos.posCost,
            openCost: pos.posCost, // Usar posCost como aproximación
            fundingCost: pos.fundingFee ?? 0, // Usar fundingFee si disponible
            realisedCost: pos.realisedCost,
            autoDeposit: pos.autoDeposit,
            maintainMargin: pos.maintainMargin,
            marginMode: pos.marginMode,
            riskLimit: pos.riskLimit,
            adlLevel: pos.adlLevel ?? 0, // No disponible, usar 0
            posStatus: pos.isOpen ? 'OPEN' : 'CLOSED', // Inferir de isOpen
            tradeType: pos.positionSide, // Usar positionSide ('BOTH')
          }),
        )
        this.logger.debug(
          `Posiciones obtenidas: ${cleanPositions.length} posiciones`,
        )
        return cleanPositions
      }
      this.logger.warn('No se encontraron datos de posiciones en la respuesta')
      return undefined
    } catch (error) {
      this.logger.error(
        `Error al obtener posiciones: ${error.message} - Stack: ${error.stack}`,
      )
      if (error.response) {
        this.logger.error(
          `Detalles del error HTTP: Status=${error.response.status}, Data=${JSON.stringify(error.response.data)}`,
        )
      }
      return undefined
    }
  }
}
