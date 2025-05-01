import { createMemoryHistory, createRouter } from 'vue-router'

import BitgetView from './ui/views/BitgetView.vue'
import BingxView from './ui/views/BingxView.vue'
import ChartsView from './ui/views/ChartsView.vue'
import BotsView from './ui/views/BotsView.vue'

const routes = [
  { path: '/', component: BingxView },
  { path: '/bitget', component: BitgetView },
  { path: '/bingx', component: BingxView },
  { path: '/charts', component: ChartsView },
  { path: '/bots', component: BotsView },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
