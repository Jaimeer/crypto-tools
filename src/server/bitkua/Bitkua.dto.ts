export type BitkuaActionUpdateStatus = {
  botId: string
  action: 'updateStatus'
  status: 'active' | 'stop' | 'onlysell'
}

export type BitkuaActionUpdateSafe = {
  botId: string
  action: 'updateSafe'
  safe: boolean
}

export type BitkuaActionUpdateStrategy = {
  botId: string
  action: 'updateStrategy'
  strategy: string
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

export type BitkuaAction =
  | BitkuaActionUpdateStatus
  | BitkuaActionUpdateSafe
  | BitkuaActionUpdateAmount
  | BitkuaActionUpdateStrategy
  | BitkuaActionDelete
  | BitkuaActionReset
