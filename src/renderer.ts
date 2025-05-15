import { createApp } from 'vue'
import { createPinia } from 'pinia'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

import App from './App.vue'
import { router } from './router'
import { NotifyMessage } from './server/messages.dto'
import { useBingxTransactionsStore } from './ui/store/bingx/bingxTransactions.store'
import { useBingxTradesStore } from './ui/store/bingx/bingxTrades.store'
import { useBingxBalanceStore } from './ui/store/bingx/bingxBalance.store'
import { useBingxPositionsStore } from './ui/store/bingx/bingxPositions.store'
import { useBingxContractsStore } from './ui/store/bingx/bingxContracts.store'
import { useBingxKLinesStore } from './ui/store/bingx/bingxKLines.store'
import { useBitkuaBotsStore } from './ui/store/bitkua/bitkuaBots.store'
import { useBitgetBalanceStore } from './ui/store/bitget/bitgetBalance.store'
import { useBitgetPositionsStore } from './ui/store/bitget/bitgetPositions.store'
import { useBitgetTransactionsStore } from './ui/store/bitget/bitgetTransactions.store'
import { useBitgetContractsStore } from './ui/store/bitget/bitgetContracts.store'
import { useBitgetKLinesStore } from './ui/store/bitget/bitgetKLines.store'
import { useBitgetTradesStore } from './ui/store/bitget/bitgetTrades.store'
import { useKucoinBalanceStore } from './ui/store/kucoin/kucoinBalance.store'
import { useKucoinPositionsStore } from './ui/store/kucoin/kucoinPositions.store'
import { useKucoinTransactionsStore } from './ui/store/kucoin/kucoinTransactions.store'
import { useKucoinContractsStore } from './ui/store/kucoin/kucoinContracts.store'
import { useKucoinKLinesStore } from './ui/store/kucoin/kucoinKLines.store'
import { useKucoinTradesStore } from './ui/store/kucoin/kucoinTrades.store'
import { useBitkuaDataMarketStore } from './ui/store/bitkua/bitkuaDataMarket.store'

const pinia = createPinia()

const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(FloatingVue)
app.mount('#app')

const bingxTransactionsStore = useBingxTransactionsStore()
const bingxTradesStore = useBingxTradesStore()
const bingxBalanceStore = useBingxBalanceStore()
const bingxPositionsStore = useBingxPositionsStore()
const bingxContractsStore = useBingxContractsStore()
const bingxKlineStore = useBingxKLinesStore()

const bitgetTransactionsStore = useBitgetTransactionsStore()
const bitgetTradesStore = useBitgetTradesStore()
const bitgetBalanceStore = useBitgetBalanceStore()
const bitgetPositionsStore = useBitgetPositionsStore()
const bitgetContractsStore = useBitgetContractsStore()
const bitgetKlineStore = useBitgetKLinesStore()

const kucoinTransactionsStore = useKucoinTransactionsStore()
const kucoinTradesStore = useKucoinTradesStore()
const kucoinBalanceStore = useKucoinBalanceStore()
const kucoinPositionsStore = useKucoinPositionsStore()
const kucoinContractsStore = useKucoinContractsStore()
const kucoinKlineStore = useKucoinKLinesStore()

const botsStore = useBitkuaBotsStore()
const dataMarketStore = useBitkuaDataMarketStore()

const updateDataHandler = (message: NotifyMessage) => {
  switch (message.store) {
    case 'bingx.transactions':
      bingxTransactionsStore.processMessage(message.transactions)
      break
    case 'bingx.trades':
      bingxTradesStore.processMessage(message.trades)
      break
    case 'bingx.balance':
      bingxBalanceStore.processMessage(message.balance)
      break
    case 'bingx.positions':
      bingxPositionsStore.processMessage(message.positions)
      break
    case 'bingx.contracts':
      bingxContractsStore.processMessage(message.contracts)
      break
    case 'bingx.klines':
      bingxKlineStore.processMessage(
        message.symbol,
        message.period,
        message.klines,
      )
      break
    case 'bitget.transactions':
      bitgetTransactionsStore.processMessage(message.transactions)
      break
    case 'bitget.trades':
      bitgetTradesStore.processMessage(message.trades)
      break
    case 'bitget.balance':
      bitgetBalanceStore.processMessage(message.balance)
      break
    case 'bitget.positions':
      bitgetPositionsStore.processMessage(message.positions)
      break
    case 'bitget.contracts':
      bitgetContractsStore.processMessage(message.contracts)
      break
    case 'bitget.klines':
      bitgetKlineStore.processMessage(
        message.symbol,
        message.period,
        message.klines,
      )
      break
    case 'kucoin.transactions':
      kucoinTransactionsStore.processMessage(message.transactions)
      break
    case 'kucoin.trades':
      kucoinTradesStore.processMessage(message.trades)
      break
    case 'kucoin.balance':
      kucoinBalanceStore.processMessage(message.balance)
      break
    case 'kucoin.positions':
      kucoinPositionsStore.processMessage(message.positions)
      break
    case 'kucoin.contracts':
      kucoinContractsStore.processMessage(message.contracts)
      break
    case 'kucoin.klines':
      kucoinKlineStore.processMessage(
        message.symbol,
        message.period,
        message.klines,
      )
      break

    case 'bots':
      botsStore.processMessage(message.bots)
      break
    case 'dataMarket':
      dataMarketStore.processMessage(message.dataMarket)
      break
    default:
      console.log(message)
      break
  }
}

window.electronAPI.onUpdateData(updateDataHandler)
