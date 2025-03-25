<script setup lang="ts">
import ccxt from 'ccxt'
import { onMounted, ref } from 'vue'

const bingX = new ccxt.bingx({
  apiKey: 'YOUR_API_KEY',
  secret: 'YOUR_SECRET_KEY',
})

async function fetchTransactions() {
  const transactions = await bingX.fetchMyTrades('BTC/USDT')
  return transactions
}

const transactions = ref([])
onMounted(async () => {
  transactions.value = await fetchTransactions()
  console.log(transactions)
})
</script>

<template>
  <div class="bg-red-200">
    <h1>Transactions</h1>
    <pre>{{ transactions }}</pre>
  </div>
</template>
