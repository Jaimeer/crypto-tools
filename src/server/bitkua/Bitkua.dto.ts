export type BitkuaActionUpdateStatus = {
  botId: string
  action: 'updateStatus'
  status: 'active' | 'stop' | 'onlysell'
  amount?: number
}

export type BitkuaAction = BitkuaActionUpdateStatus
