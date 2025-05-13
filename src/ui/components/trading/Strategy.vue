<script setup lang="ts">
import { useBitkuaStrategiesStore } from '../../store/bitkua/bitkuaStrategies.store'

const props = defineProps<{
  strategy: string
}>()

const bitkuaStrategiesStore = useBitkuaStrategiesStore()

const strategyName = (strategy: string) => {
  if (!strategy) return '---'
  return (
    bitkuaStrategiesStore.strategies
      .find((x) => x.slug === strategy)
      ?.name.replace('Long', '')
      .replace('Short', '') ?? strategy
  )
}
</script>

<template>
  <div>{{ strategyName(props.strategy) }}</div>
</template>
