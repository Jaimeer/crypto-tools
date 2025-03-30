import { createMemoryHistory, createRouter } from 'vue-router'

import DashboardView from './ui/views/DashboardView.vue'
import ChartsView from './ui/views/ChartsView.vue'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/charts', component: ChartsView },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
