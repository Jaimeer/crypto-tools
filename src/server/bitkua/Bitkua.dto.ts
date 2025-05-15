export type BotStatus = 'active' | 'stop' | 'onlysell'
export type BotStrategies =
  | 'aiexpertavg'
  | 'aiexpertavgplus'
  | 'degen'
  | 'infinity'
  | 'karlosavg'
  | 'ladominantkong'
  | 'lamilagrosa'
  | 'lamilagrosapro'
  | 'liquidationpoint'
  | 'liquiditypool'
  | 'longalashitcoin'
  | 'pmd'
  | 'smartcandle'
  | 'smartmoney'
  | 'sniperagresive'

export type BotStrategiesAll =
  | 'aiexpertavg'
  | 'shortaiexpertavg'
  | 'aiexpertavgplus'
  | 'shortaiexpertavgplus'
  | 'degen'
  | 'shortdegen'
  | 'infinity'
  | 'karlosavg'
  | 'shortkarlosavg'
  | 'ladominantkong'
  | 'shortladominantkong'
  | 'lamilagrosa'
  | 'shortlamilagrosa'
  | 'lamilagrosapro'
  | 'shortlamilagrosapro'
  | 'liquidationpoint'
  | 'shortliquidationpoint'
  | 'liquiditypool'
  | 'shortliquiditypool'
  | 'longalashitcoin'
  | 'shortalashitcoin'
  | 'pmd'
  | 'shortpmd'
  | 'smartcandle'
  | 'shortsmartcandle'
  | 'smartmoney'
  | 'shortsmartmoney'
  | 'sniperagresive'
  | 'shortsniperagresive'

export type BotExchange = 'Bingx' | 'Bitget'

export type BitkuaActionUpdateStatus = {
  botId: string
  action: 'updateStatus'
  status: BotStatus
}

export type BitkuaActionUpdateSafe = {
  botId: string
  action: 'updateSafe'
  safe: boolean
}

export type BitkuaActionUpdateStrategy = {
  botId: string
  action: 'updateStrategy'
  strategy: BotStrategiesAll
}

export type BitkuaActionUpdateAmount = {
  botId: string
  action: 'updateAmount'
  amount: number
}

export type BitkuaActionDelete = {
  botId: string
  action: 'delete'
}

export type BitkuaActionReset = {
  botId: string
  action: 'reset'
  symbol: string
}

export type BitkuaActionCreateBot = {
  action: 'createBot'
  exchange: BotExchange
  tokenId: string
  symbol: string
  amount: number
  strategy: BotStrategies
  status: BotStatus
  safe: boolean
  long: boolean
  short: boolean
}

export type BitkuaAction =
  | BitkuaActionUpdateStatus
  | BitkuaActionUpdateSafe
  | BitkuaActionUpdateAmount
  | BitkuaActionUpdateStrategy
  | BitkuaActionDelete
  | BitkuaActionReset
  | BitkuaActionCreateBot

export type BitkuaDataMarket = {
  symbol: string
  exchange: string
  price: string
  sma55: string
  sma55_1d: string
  maximoD: string
  minimoD: string
  pmd: string
  max15_1h: string
  min15_1h: string
  rangoSuperior: string
  rangoInferior: string
  LiqMax: string
  LiqMin: string
  ratio_fvd_mc: string
}

export type BitkuaSecurityToken = {
  idtokens: string
  security_token: string
  exchange: string
}
