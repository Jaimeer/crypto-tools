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
  positionSide: string
}

export type BitkuaActionCreateBot = {
  action: 'createBot'
  exchange: BotExchange
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
