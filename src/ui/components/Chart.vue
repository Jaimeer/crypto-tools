<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'

const props = defineProps<{
  symbols: string[]
  data: { key: string; symbols: Record<string, { num: number; value: number; all: number }> }[]
}>()

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement)

const generateColor = (symbol: string) => {
  const hash = symbol.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  const hue = hash % 360
  return `hsl(${hue}, 100%, 50%)`
}

const chartData = {
  labels: props.data.map(x => x.key).reverse(),
  datasets: [
    ...props.symbols.map(symbol => ({
      label: symbol.replace('-USDT', ''),
      data: props.data.map(x => x.symbols[symbol]?.all ?? 0).reverse(),
      borderColor: generateColor(symbol),
      backgroundColor: generateColor(symbol),
      yAxisID: 'y',
    })),
    // {
    //   label: 'Dataset 1',
    //   data: [10, 20, 30],
    //   borderColor: 'red',
    //   backgroundColor: '#FF000050',
    //   yAxisID: 'y',
    // },
    // {
    //   label: 'Dataset 2',
    //   data: [30, 20, 10],
    //   borderColor: 'blue',
    //   backgroundColor: '#0000FF50',
    //   yAxisID: 'y',
    // },
  ],
}
const chartOptions = {
  responsive: true,
  scales: {
    x: {
      title: {
        display: false,
        text: 'Day',
      },
    },
    y: {
      stacked: false,
      title: {
        display: true,
        text: 'USDT',
      },
    },
  },
}
</script>

<template>
  <div>
    <Line id="my-chart-id" :options="chartOptions" :data="chartData" height="50px" />
  </div>
</template>
