<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { init, dispose, registerOverlay } from 'klinecharts'
import { vElementSize } from '@vueuse/components'
import { addMonths, subDays, subHours } from 'date-fns'
import { Icon } from '@iconify/vue'
import { simpleAnnotationDown } from './klinechart/simpleAnnotationDown.overlay'
import { rectangle } from './klinechart/rectangle.overlay'
import { KLine, Period, Position, Trade } from '../../server/data.dto'
import { useBingxTransactionsStore } from '../store/bingx/bingxTransactions.store'
import { useBingxTradesStore } from '../store/bingx/bingxTrades.store'
import { useBingxPositionsStore } from '../store/bingx/bingxPositions.store'
import Price from './Price.vue'
import Rescue from './Rescue.vue'
import NumTrades from './NumTrades.vue'
import { BitkuaActionUpdateStatus } from '../../server/bitkua/Bitkua.dto'
import { useBitkuaBotsStore } from '../store/bitkua/bitkuaBots.store'

registerOverlay(rectangle)
registerOverlay(simpleAnnotationDown)

const bingxTradesStore = useBingxTradesStore()
const bingxTransactionsStore = useBingxTransactionsStore()
const bingxPositionsStore = useBingxPositionsStore()
const bitkuaBotsStore = useBitkuaBotsStore()

const chart = ref()

const props = defineProps<{
  symbol: string
  period: Period
  hideTrades: boolean
  klines: KLine[]
  trades: Trade[]
  positions: Position[]
  size: 'small' | 'large'
}>()

const printData = (start: boolean) => {
  console.log('AAAAA-1')
  if (chart.value) {
    console.log('AAAAA-2')
    const priceSample = props.klines[0]?.close
    const decimals =
      priceSample > 1000 ? 0 : priceSample > 10 ? 2 : priceSample > 0 ? 4 : 6

    const data = props.klines.toReversed() ?? []
    if (start) {
      console.log('printData', { decimals, data })
      chart.value.setPrecision({ price: decimals })
      chart.value.applyNewData(data)
    } else {
      const latestPoint = data[data.length - 1]
      const currentData = chart.value.getDataList()
      const lastChartTimestamp =
        currentData.length > 0
          ? currentData[currentData.length - 1].timestamp
          : 0

      if (latestPoint.timestamp !== lastChartTimestamp) {
        const latestPoint2 = data[data.length - 2]
        chart.value.updateData(latestPoint2) // Update the previous last candle with the last info
        chart.value.updateData(latestPoint)
      } else {
        chart.value.updateData(latestPoint)
      }
    }
    draw()
  }
}

const filteredTrades = computed(() => {
  const minDate = Math.min(
    props.klines[0]?.timestamp,
    props.klines[props.klines.length - 1]?.timestamp,
  )
  return props.trades.filter(
    (x) =>
      new Date(x.filledTime).getTime() >
      subHours(new Date(minDate), 1).getTime(),
  )
})

const draw = () => {
  chart.value.removeOverlay({ groupId: 'trades' })
  chart.value.removeOverlay({ groupId: 'positions' })

  // Buys & Sells
  if (!props.hideTrades) {
    filteredTrades.value.forEach((trade) => {
      const tradeTime = new Date(trade.filledTime).getTime()
      const tradePrice = trade.price
      const isProfit = trade.realisedPNL > 0
      const color = trade.side === 'BUY' ? '#20aa93' : '#FF0000'
      const overlayName =
        trade.side === 'BUY' ? 'simpleAnnotationDown' : 'simpleAnnotation'
      chart.value.createOverlay({
        name: overlayName,
        groupId: 'trades',
        points: [{ timestamp: tradeTime, value: tradePrice }],
        lock: true,
        extendData: isProfit
          ? trade.realisedPNL.toFixed(2)
          : trade.side.charAt(0),
        styles: {
          text: {
            color: '#FFFFFF',
            backgroundColor: color,
          },
          polygon: { color },
          line: { color },
        },
      })
    })
  }

  const color = (opacity: number, isLong: boolean) =>
    isLong ? `#6666ff${opacity}` : `#ff33cc${opacity}`

  // Positions
  props.positions.forEach((position) => {
    // Current LONG/SHORT price
    const positionPrice = position.avgPrice
    const isLong = position.positionSide === 'LONG'
    const lineColor = color(90, isLong)
    const fillColor = color(20, isLong)

    chart.value.createOverlay({
      name: 'priceLine',
      groupId: 'positions',
      points: [{ value: positionPrice }],
      lock: true,
      styles: {
        text: {
          color: '#FFFFFF',
          backgroundColor: lineColor,
        },
        polygon: { color: lineColor },
        line: { color: lineColor },
      },
    })
    // Exit price at 1%
    const percentage = 1
    const exitPrice =
      positionPrice + ((isLong ? 1 : -1) * positionPrice * percentage) / 100
    chart.value.createOverlay({
      name: 'priceLine',
      groupId: 'positions',
      points: [{ value: exitPrice }],
      lock: true,
      styles: {
        text: {
          color: '#FFFFFF',
          backgroundColor: lineColor,
        },
        polygon: { color: lineColor },
        line: { color: lineColor },
      },
    })
    // Fill rectangle
    const startTime = 0
    const endTime = addMonths(new Date(), 1).getTime()
    chart.value.createOverlay({
      name: 'rectangle',
      groupId: 'positions',
      points: [
        { timestamp: startTime, value: positionPrice },
        { timestamp: endTime, value: exitPrice },
      ],
      lock: true,
      styles: {
        rect: {
          style: 'fill',
          borderColor: fillColor,
          borderSize: 0,
          color: fillColor,
        },
      },
    })
  })

  // rescue lines
  const currentPrice = props.klines[0]?.close
  const lineColor = '#FFFFFF'

  props.positions.forEach((position) => {
    if (currentPrice) {
      const isLong = position.positionSide === 'LONG'
      const lineColor = color(90, isLong)
      const fillColor = color(20, isLong)

      for (const percentage of [5, 10, 50]) {
        const price = calculateNewAvgOpenPrice(position, percentage)

        chart.value.createOverlay({
          name: 'priceLine',
          groupId: 'positions',
          points: [{ value: price }],
          lock: true,
          styles: {
            text: {
              color: '#FFFFFF',
              backgroundColor: lineColor,
            },
            polygon: { color: lineColor },
            line: {
              style: 'dashed',
              color: lineColor,
              dashedValue: [2, 2],
            },
          },
        })
      }
    }
  })
}

const calculateNewAvgOpenPrice = (position: Position, desiredGap: number) => {
  if (!position) return 0
  const markPrice = position.markPrice
  const avgOpenPrice = position.avgPrice

  const offset = (avgOpenPrice - markPrice) * (desiredGap / 100)
  const newAvgOpenPrice = markPrice + offset
  return newAvgOpenPrice
}

const updateChartSize = () => {
  // const chartContainer = document.getElementById(`chart-${props.symbol}`)
  if (chart.value) {
    chart.value.resize(chart.value.clientWidth, chart.value.clientHeight)
  }
}

const transactions = computed(() => {
  return bingxTransactionsStore.transactions.filter((x) => x.symbol)
})

const trades = computed(() => {
  return bingxTradesStore.trades
})

type PriceData = {
  num: number
  pnl: number
  all: number
  charges: number
  volume: number
}

const symbolData = computed(() => {
  const initDate = subDays(new Date(), 1).getTime()
  const data = transactions.value.reduce(
    (acc, transaction) => {
      if (transaction.symbol !== props.symbol) return acc
      const transactionDate = new Date(transaction.time)
      if (transactionDate.getTime() < initDate) return acc

      if (!acc) {
        acc = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
      }
      if (
        ['REALIZED_PNL', 'close_long', 'close_short'].includes(
          transaction.incomeType,
        )
      ) {
        acc.num++
        acc.pnl += transaction.income
      } else {
        acc.charges += transaction.income
      }
      acc.all += transaction.income
      return acc
    },
    { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 } as PriceData,
  )

  trades.value.reduce((acc, trade) => {
    const tradeDate = new Date(trade.filledTime)
    if (trade.symbol !== props.symbol) return acc
    if (tradeDate.getTime() < initDate) return acc

    if (!acc) {
      acc = { num: 0, pnl: 0, all: 0, charges: 0, volume: 0 }
    }
    if (trade.realisedPNL !== 0) return acc
    acc.volume += trade.quoteQty
    return acc
  }, data)

  return data
})

const sides = ['long', 'short'] as const
const status = ['active', 'stop', 'onlysell'] as const

const sendAction = (
  botId: string,
  status: 'active' | 'stop' | 'onlysell',
  amount?: number,
) => {
  const message: BitkuaActionUpdateStatus = {
    action: 'updateStatus',
    botId,
    status,
  }
  window.electronAPI.sendBitkuaAction(message)
}

const bot = computed(() => {
  return {
    long: bitkuaBotsStore.bots.find(
      (x) =>
        x.symbol.toLowerCase() === props.symbol.toLowerCase() &&
        !x.strategy.includes('short'),
    ),
    short: bitkuaBotsStore.bots.find(
      (x) =>
        x.symbol.toLowerCase() === props.symbol.toLowerCase() &&
        x.strategy.includes('short'),
    ),
  }
})

const strategyName = (strategy: string) => {
  if (!strategy) return '---'
  return (
    {
      ladominantkong: 'DOM',
      shortladominantkong: 'DOM',
      shortalashitcoin: 'LSH',
      longalashitcoin: 'LSH',
      liquiditypool: 'LLP',
      shortliquiditypool: 'LLP',
      aiexpertavg: 'AIE',
      shortaiexpertavg: 'AIE',
      aiexpertavgplus: 'AIP',
      shortaiexpertavgplus: 'AIP',
      lamilagrosa: 'LMG',
      shortlamilagrosa: 'LMG',
      lamilagrosapro: 'LMP',
      shortlamilagrosapro: 'LMP',
      pmd: 'PMD',
      shortpmd: 'PMD',
      degen: 'DGN',
      shortdegen: 'DGN',
    }[strategy] ?? strategy
  )
}

onMounted(async () => {
  console.log('BBB-1')
  chart.value = init(`chart-${props.symbol}`, {
    styles: {
      grid: {
        horizontal: {
          color: '#444',
        },
        vertical: {
          color: '#444',
        },
      },
    },
  })

  console.log('BBB-2')
  printData(true)
})

onUnmounted(() => {
  dispose(`chart-${props.symbol}`)
})

watch(
  () => props.klines[0].close,
  () => {
    console.log('CCCC')
    printData(false)
  },
)

watch(
  () => props.hideTrades,
  () => {
    console.log('DDDD')
    draw()
  },
)
</script>

<template>
  <div
    class="relative flex flex-col rounded border border-gray-600 p-4 text-slate-400"
    v-element-size="updateChartSize"
    :class="{
      'border-t-green-600 border-l-green-600': bot.long?.status === 'active',
      'border-t-red-600 border-l-red-600': bot.long?.status === 'stop',
      'border-t-amber-600 border-l-amber-600': bot.long?.status === 'onlysell',
      'border-r-green-600 border-b-green-600': bot.short?.status === 'active',
      'border-r-red-600 border-b-red-600': bot.short?.status === 'stop',
      'border-r-amber-600 border-b-amber-600': bot.short?.status === 'onlysell',
    }"
  >
    <div class="absolute bottom-20 text-lg font-bold text-slate-700 uppercase">
      {{ symbol }} - {{ period }} - {{ size }}
    </div>
    <div
      class="absolute top-10 right-16 text-lg font-bold text-slate-700 uppercase"
    >
      {{ symbol }} - {{ period }}
    </div>
    <div class="flex items-center justify-between text-xs">
      <div>{{ symbol }} - {{ period }}</div>
      <div class="mr-12 flex justify-end gap-2">
        <span class="text-slate-400">Last24h</span>
        <NumTrades :num="symbolData.num" />
        <Price :value="symbolData.volume" color="orange" :decimals="2" />
        <Price :value="symbolData.all" :decimals="2" />
        <div>
          <template v-if="symbolData.volume !== 0">
            {{ ((symbolData.all * 100) / symbolData.volume).toFixed(2) }}%
          </template>
          <template v-else> - </template>
        </div>
        <Price :value="symbolData.all / 24" color="violet" />
      </div>
    </div>

    <div
      :id="`chart-${symbol}`"
      class="w-full"
      :class="{
        'h-[20rem]': size === 'small',
        'h-[40rem]': size === 'large',
      }"
    />
    <div class="t-2 flex items-center justify-between">
      <div class="grid w-full grid-cols-2 items-center justify-between">
        <div v-for="side in sides" class="flex flex-col">
          <div
            class="flex items-center gap-1 text-xs"
            :class="{
              'justify-end': side === 'short',
            }"
          >
            <div>
              <span
                class="font-bold uppercase"
                :class="{
                  'text-[#6666ff]': side === 'long',
                  'text-[#ff33cc]': side === 'short',
                }"
              >
                {{ side }}
              </span>
              <span class="text-blue-400">[{{ bot[side]?.amount }}]</span>
              <span
                :class="{
                  'text-slate-400': bot[side]?.count === 0,
                  'text-lime-400':
                    bot[side]?.count > 0 && bot[side]?.count < 14,
                  'text-red-400': bot[side]?.count >= 13,
                }"
              >
                [{{ bot[side]?.count }}]
              </span>
            </div>
            <div class="text-slate-400">
              {{ strategyName(bot[side]?.strategy) }}
            </div>
            <div>
              <button
                v-for="status in status"
                class="cursor-pointer rounded text-xs transition disabled:cursor-default"
                :class="{
                  'px-1 text-green-600 hover:text-green-400 disabled:bg-green-900 disabled:text-green-200':
                    status === 'active',
                  'px-1 text-red-600 hover:text-red-400 disabled:bg-red-900 disabled:text-red-200':
                    status === 'stop',
                  'px-1 text-amber-600 hover:text-amber-400 disabled:bg-amber-900 disabled:text-amber-200':
                    status === 'onlysell',
                }"
                :disabled="bot[side]?.status === status"
                @click="sendAction(bot[side]?.id, status)"
              >
                {{ status.slice(0, 1).toUpperCase() }}
              </button>
            </div>
          </div>
          <div
            class="text-[10px]"
            :class="{
              'justify-end text-end': side === 'short',
            }"
          >
            <div
              class="flex items-center gap-1"
              :class="{ 'justify-end': side === 'short' }"
            >
              <Price
                :value="
                  bingxPositionsStore.positions.filter((position) => {
                    return (
                      position.symbol === symbol &&
                      position.positionSide === side.toUpperCase()
                    )
                  })[0]?.positionValue
                "
                :decimals="2"
                color="violet"
              />
              <Price
                :value="
                  bingxPositionsStore.positions.filter((position) => {
                    return (
                      position.symbol === symbol &&
                      position.positionSide === side.toUpperCase()
                    )
                  })[0]?.unrealizedProfit
                "
                :decimals="2"
              />
              <span class="text-slate-600">/</span>
              <Price
                :value="
                  100 *
                  (bingxPositionsStore.positions.filter((position) => {
                    return (
                      position.symbol === symbol &&
                      position.positionSide === side.toUpperCase()
                    )
                  })[0]?.pnlRatio ?? 0)
                "
                :decimals="2"
                suffix="%"
              />
              <div class="flex items-center justify-end gap-0.5">
                <Icon
                  v-for="i in Math.floor(
                    Math.abs(
                      (100 *
                        (bingxPositionsStore.positions.find(
                          (position) =>
                            position.symbol === symbol &&
                            position.positionSide === side.toUpperCase(),
                        )?.pnlRatio ?? 0)) /
                        100,
                    ),
                  )"
                  :key="i"
                  class="text-red-500"
                  icon="ic:round-warning"
                />
                <Icon
                  v-for="i in Math.floor(
                    Math.abs(
                      (100 *
                        (bingxPositionsStore.positions.find(
                          (position) =>
                            position.symbol === symbol &&
                            position.positionSide === side.toUpperCase(),
                        )?.pnlRatio ?? 0)) %
                        100,
                    ) / 10,
                  )"
                  :key="i"
                  class="text-yellow-400"
                  icon="ic:round-warning"
                />
              </div>
              <Rescue
                :symbol="symbol"
                :side="side"
                :allVisible="true"
                :gaps="[5, 10, 50]"
                :positions="positions"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
