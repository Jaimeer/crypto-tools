import { createMemoryHistory, createRouter } from 'vue-router'

import BitgetView from './ui/views/BitgetView.vue'
import BingxView from './ui/views/BingxView.vue'
import ChartsView from './ui/views/ChartsView.vue'
import BotsView from './ui/views/BotsView.vue'
import DataMarketView from './ui/views/DataMarketView.vue'

const routes = [
  { path: '/', component: DataMarketView },
  { path: '/bitget', component: BitgetView },
  { path: '/bingx', component: BingxView },
  { path: '/bots', component: BotsView },
  { path: '/data-market', component: DataMarketView },
  { path: '/charts', component: ChartsView },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
