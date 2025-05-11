<script setup lang="ts">
const props = defineProps<{
  strategy: string
}>()

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
</script>

<template>
  <div>{{ strategyName(props.strategy) }}</div>
</template>
