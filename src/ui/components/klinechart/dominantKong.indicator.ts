/**
 * Dominant Kong - Pro Trader Indicator for KLineChart
 * Replicates the Pine Script logic for SMA crossovers with alerts and labels
 */
import {
  KLineData,
  IndicatorTemplate,
  IndicatorCalcCallback,
  IndicatorDrawCallback,
  utils,
} from 'klinecharts'

// Helper function to calculate SMA
function calculateSMA(data: KLineData[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
      continue
    }
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, val) => acc + val.close, 0)
    result.push(sum / period)
  }
  return result
}

// Helper function to detect crossover
function crossover(
  series1: number[],
  series2: number[],
  index: number,
): boolean {
  if (index < 1) return false
  return (
    series1[index] > series2[index] && series1[index - 1] <= series2[index - 1]
  )
}

// Helper function to detect crossunder
function crossunder(
  series1: number[],
  series2: number[],
  index: number,
): boolean {
  if (index < 1) return false
  return (
    series1[index] < series2[index] && series1[index - 1] >= series2[index - 1]
  )
}

// Define the indicator's data structure
interface DominantKongData {
  sma5: number
  sma55: number
  sma55Color: string
  annotation?: Annotation
}

// Define the indicator's calculation parameters
interface DominantKongParams {
  period1: number
  period2: number
  minCrossPercent: number
  targetPercent: number
  additionalPercent: number
  activationPriceLong: number
  activationPriceShort: number
  allowBuy: boolean
  allowSell: boolean
  allowBuyCounter: boolean
  allowSellCounter: boolean
}

// Define the annotation structure
interface Annotation {
  position: 'top' | 'bottom'
  text: string
  color: string
  backgroundColor: string
  timestamp: number
  y: number
}

// Indicator calculation logic
const calc: IndicatorCalcCallback<
  DominantKongData,
  DominantKongParams,
  unknown
> = (kLineDataList, indicator) => {
  const calcParams = indicator.calcParams
  const {
    period1,
    period2,
    minCrossPercent,
    targetPercent,
    additionalPercent,
    activationPriceLong,
    activationPriceShort,
    allowBuy,
    allowSell,
    allowBuyCounter,
    allowSellCounter,
  } = calcParams[0]

  const sma5 = calculateSMA(kLineDataList, period1)
  const sma55 = calculateSMA(kLineDataList, period2)

  let vcup = 0
  let vcdown = 0
  let operation = ''
  let open = 0
  let targetUp = 0
  let targetDown = 0
  let counterAlert = 0
  let counterUp = 0
  let counterDown = 0

  const result: DominantKongData[] = []

  for (let i = 0; i < kLineDataList.length; i++) {
    const data = kLineDataList[i]
    const close = data.close
    const low = data.low
    const high = data.high
    const timestamp = data.timestamp

    counterUp++
    counterDown++
    counterAlert++

    const sma5Value = utils.isValid(sma5[i]) ? sma5[i] : NaN
    const sma55Value = utils.isValid(sma55[i]) ? sma55[i] : NaN

    const colorMedia = sma5Value > sma55Value ? '#08F00F' : '#FF0000'

    let annotation: Annotation | undefined

    // Detect crossover
    if (crossover(sma5, sma55, i)) {
      vcup = sma5Value
      const difUp =
        ((Math.max(vcup, vcdown) - Math.min(vcup, vcdown)) * 100) /
        Math.max(vcup, vcdown)
      counterDown = 0

      if (
        difUp > minCrossPercent &&
        allowBuy &&
        close < activationPriceLong &&
        counterAlert >= 1
      ) {
        operation = 'LONG'
        open = vcup
        targetUp = open + (open * targetPercent) / 100
        const percentText = difUp.toFixed(2) + '%'
        annotation = {
          position: 'bottom',
          text: `LONG\n${percentText}`,
          color: '#FFFFFF',
          backgroundColor: '#20aa93',
          timestamp: timestamp,
          y: low * 0.99,
        }
        counterAlert = 0
      }
    }

    // Detect crossunder
    if (crossunder(sma5, sma55, i)) {
      vcdown = sma5Value
      const difDown =
        ((Math.max(vcup, vcdown) - Math.min(vcup, vcdown)) * 100) /
        Math.max(vcup, vcdown)
      counterUp = 0

      if (
        difDown > minCrossPercent &&
        allowSell &&
        close > activationPriceShort &&
        counterAlert >= 1
      ) {
        operation = 'SHORT'
        open = vcdown
        targetDown = open - (open * targetPercent) / 100
        const percentText = difDown.toFixed(2) + '%'
        annotation = {
          position: 'top',
          text: `SHORT\n${percentText}`,
          color: '#FFFFFF',
          backgroundColor: '#FF0000',
          timestamp: timestamp,
          y: high * 1.01,
        }
        counterAlert = 0
      }
    }

    // Check LONG target hit
    if (
      operation === 'LONG' &&
      close > targetUp &&
      allowSellCounter &&
      close > activationPriceShort
    ) {
      const pepe = (close * additionalPercent) / 100
      targetUp = close + pepe
      const reached = (((close - open) * 100) / open).toFixed(2) + '%'
      annotation = {
        position: 'top',
        text: `+${reached}\nMax`,
        color: '#000000',
        backgroundColor: '#F3BB03',
        timestamp: timestamp,
        y: high,
      }
    }

    // Check SHORT target hit
    if (
      operation === 'SHORT' &&
      close < targetDown &&
      allowBuyCounter &&
      close < activationPriceLong
    ) {
      const pepe = (close * additionalPercent) / 100
      targetDown = close - pepe
      const reached = (((open - close) * 100) / open).toFixed(2) + '%'
      annotation = {
        position: 'bottom',
        text: `-${reached}\nMin`,
        color: '#000000',
        backgroundColor: '#03D7F3',
        timestamp: timestamp,
        y: low,
      }
    }

    result.push({
      sma5: sma5Value,
      sma55: sma55Value,
      sma55Color: colorMedia,
      annotation,
    })
  }
  // Find the last max and last min annotations
  let lastMaxAnnotation: Annotation | undefined = undefined
  let lastMinAnnotation: Annotation | undefined = undefined

  for (let i = result.length - 1; i >= 0; i--) {
    const anno = result[i].annotation
    if (anno) {
      if (anno.text.includes('Max') && !lastMaxAnnotation) {
        lastMaxAnnotation = anno
      } else if (anno.text.includes('Min') && !lastMinAnnotation) {
        lastMinAnnotation = anno
      }
    }
  }

  // Keep all LONG and SHORT annotations, but only the last max and min
  for (let i = 0; i < result.length; i++) {
    const anno = result[i].annotation
    if (anno) {
      if (
        (anno.text.includes('Max') && anno !== lastMaxAnnotation) ||
        (anno.text.includes('Min') && anno !== lastMinAnnotation)
      ) {
        result[i].annotation = undefined
      }
      // LONG and SHORT annotations are kept intact
    }
  }

  return result
}

// Custom draw function
const draw: IndicatorDrawCallback<
  DominantKongData,
  DominantKongParams,
  unknown
> = ({ ctx, chart, indicator, bounding, xAxis, yAxis }) => {
  const { result } = indicator

  // Draw SMA lines
  ctx.lineWidth = 2
  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1]
    const curr = result[i]
    if (
      !utils.isValid(prev.sma5) ||
      !utils.isValid(curr.sma5) ||
      !utils.isValid(prev.sma55) ||
      !utils.isValid(curr.sma55)
    )
      continue

    const x1 = xAxis.convertToPixel(i - 1)
    const x2 = xAxis.convertToPixel(i)
    // const y1_sma5 = yAxis.convertToPixel(prev.sma5)
    // const y2_sma5 = yAxis.convertToPixel(curr.sma5)
    const y1_sma55 = yAxis.convertToPixel(prev.sma55)
    const y2_sma55 = yAxis.convertToPixel(curr.sma55)

    // Draw SMA5
    // ctx.beginPath()
    // ctx.strokeStyle = '#0000FF'
    // ctx.moveTo(x1, y1_sma5)
    // ctx.lineTo(x2, y2_sma5)
    // ctx.stroke()

    // Draw SMA55
    ctx.beginPath()
    ctx.setLineDash([])
    ctx.strokeStyle = curr.sma55Color
    ctx.moveTo(x1, y1_sma55)
    ctx.lineTo(x2, y2_sma55)
    ctx.stroke()
  }

  // Draw annotations
  result.forEach((data, index) => {
    const anno = data.annotation
    if (!anno) return
    const dataIndex = chart
      .getDataList()
      .findIndex((d) => d.timestamp === anno.timestamp)
    if (dataIndex === -1) return
    const x = xAxis.convertToPixel(dataIndex)
    const y = yAxis.convertToPixel(anno.y)
    const lines = anno.text.split('\n')

    // Adjust font size to 10px
    const fontSize = 10

    // Adjust box dimensions for smaller text
    const boxWidth = 60
    const lineHeight = fontSize + 4 // Reduced line height
    const boxHeight = lines.length * lineHeight + 8 // Smaller padding
    const boxY = anno.position === 'top' ? y - boxHeight - 8 : y + 8

    // Draw background
    ctx.fillStyle = anno.backgroundColor
    ctx.fillRect(x - boxWidth / 2, boxY, boxWidth, boxHeight)

    // Draw text with smaller font
    ctx.fillStyle = anno.color
    ctx.font = `${fontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle' // Add this for vertical centering

    lines.forEach((line, lineIndex) => {
      // Calculate the center of each line's space
      const lineCenter = boxY + 4 + lineIndex * lineHeight + lineHeight / 2
      ctx.fillText(line, x, lineCenter)
    })
  })

  return true
}

// Indicator template
const dominantKongIndicator: IndicatorTemplate<
  DominantKongData,
  DominantKongParams,
  unknown
> = {
  name: 'DominantKongProTrader',
  shortName: 'DK Pro Trader',
  precision: 2,
  calcParams: [
    {
      period1: 5,
      period2: 55,
      minCrossPercent: 5,
      targetPercent: 15,
      additionalPercent: 3,
      activationPriceLong: 200000,
      activationPriceShort: 0.00000001,
      allowBuy: true,
      allowSell: true,
      allowBuyCounter: true,
      allowSellCounter: true,
    },
  ],
  figures: [
    { key: 'sma5', title: 'SMA5', type: 'line' },
    { key: 'sma55', title: 'SMA55', type: 'line' },
  ],
  calc,
  draw,
  createTooltipDataSource: ({ indicator }) => ({
    name: indicator.shortName,
    calcParamsText: '',
    features: [],
    legends: [],
  }),
}

export default dominantKongIndicator
