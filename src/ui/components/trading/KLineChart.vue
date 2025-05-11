<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { init, dispose, registerOverlay, registerIndicator } from 'klinecharts'
import { vElementSize } from '@vueuse/components'
import { addMonths, subDays, subHours } from 'date-fns'
import { Icon } from '@iconify/vue'
import { simpleAnnotationDown } from '../klinechart/simpleAnnotationDown.overlay'
import { rectangle } from '../klinechart/rectangle.overlay'
import { KLine, Period, Position, Trade } from '../../../server/data.dto'
import { useBingxTransactionsStore } from '../../store/bingx/bingxTransactions.store'
import { useBingxTradesStore } from '../../store/bingx/bingxTrades.store'
import { useBingxPositionsStore } from '../../store/bingx/bingxPositions.store'
import Price from './Price.vue'
import Rescue from './Rescue.vue'
import NumTrades from './NumTrades.vue'
import { BitkuaActionUpdateStatus } from '../../../server/bitkua/Bitkua.dto'
import { useBitkuaBotsStore } from '../../store/bitkua/bitkuaBots.store'
import dominantKongIndicator from '../klinechart/dominantKong.indicator'

registerOverlay(rectangle)
registerOverlay(simpleAnnotationDown)
registerIndicator(dominantKongIndicator)

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
  onlyChart?: boolean
  printDKIndicator?: boolean
}>()

const printData = (start: boolean) => {
  if (!chart.value || !props.klines.length) return

  const priceSample = props.klines[0]?.close
  const decimals =
    priceSample > 1000 ? 0 : priceSample > 10 ? 2 : priceSample > 0 ? 4 : 6

  const data = props.klines.toReversed() ?? []
  if (start) {
    chart.value.setPrecision({ price: decimals })
    chart.value.applyNewData(data)
  } else {
    const latestPoint = data[data.length - 1]
    const currentData = chart.value.getDataList()
    const lastChartTimestamp =
      currentData.length > 0
        ? (currentData[currentData.length - 1]?.timestamp ?? 0)
        : 0

    if (latestPoint?.timestamp !== lastChartTimestamp) {
      const latestPoint2 = data[data.length - 2]
      chart.value.updateData(latestPoint2) // Update the previous last candle with the last info
      chart.value.updateData(latestPoint)
    } else {
      chart.value.updateData(latestPoint)
    }
  }

  // const minPrice = Math.min(...data.map((item) => item.low))
  // const maxPrice = Math.max(...data.map((item) => item.high))

  // const axis = {
  //   minValue: -1, //minPrice * 0.1,
  //   maxValue: 1, //maxPrice * 0.2,
  // }
  // console.log(axis)

  // chart.value.setPaneOptions({
  //   id: 'candle_pane',
  //   axis,
  // })

  draw()
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
  if (!props.hideTrades && !props.onlyChart) {
    filteredTrades.value.forEach((trade) => {
      const tradeTime = new Date(trade.filledTime).getTime()
      const tradePrice = trade.price
      const isProfit = trade.realisedPNL > 0
      const opacity = isProfit ? '' : '60'
      const color =
        trade.positionSide === 'LONG'
          ? `#20aa93${opacity}`
          : `#FF0000${opacity}`
      const overlayName =
        trade.positionSide === 'LONG' && trade.side === 'BUY'
          ? 'simpleAnnotationDown'
          : trade.positionSide === 'LONG' && trade.side === 'SELL'
            ? 'simpleAnnotation'
            : trade.positionSide === 'SHORT' && trade.side === 'BUY'
              ? 'simpleAnnotationDown'
              : 'simpleAnnotation'
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
            color: `#FFFFFF${opacity}`,
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
        const price = calculateNewAvgOpenPrice(
          currentPrice,
          position,
          percentage,
        )

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

const calculateNewAvgOpenPrice = (
  markPrice: number,
  position: Position,
  desiredGap: number,
) => {
  if (!position) return 0
  // const markPrice = position.markPrice
  const avgOpenPrice = position.avgPrice

  const offset = (avgOpenPrice - markPrice) * (desiredGap / 100)
  const newAvgOpenPrice = markPrice + offset
  return newAvgOpenPrice
}

const updateChartSize = () => {
  // const chartContainer = document.getElementById(`chart-${props.symbol}-${props.period}`)
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
  chart.value = init(`chart-${props.symbol}-${props.period}`, {
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

  if (props.printDKIndicator)
    chart.value.createIndicator('DominantKongProTrader', false, {
      id: 'candle_pane',
    })
  printData(true)
})

onUnmounted(() => {
  dispose(`chart-${props.symbol}-${props.period}`)
})

watch(
  () => props.klines,
  () => {
    printData(false)
  },
  { deep: true },
)

watch(
  () => props.hideTrades,
  () => {
    draw()
  },
)
</script>

<template>
  <div
    class="relative flex h-full flex-1 flex-col rounded border border-gray-600 p-4 text-slate-400"
    v-element-size="updateChartSize"
  >
    <div class="absolute bottom-20 text-lg font-bold text-slate-700 uppercase">
      {{ symbol }} - {{ period }}
    </div>
    <div
      class="absolute top-10 right-18 text-lg font-bold text-slate-700 uppercase"
    >
      {{ symbol }} - {{ period }}
    </div>

    <div :id="`chart-${symbol}-${period}`" class="h-full w-full" />
  </div>
</template>
