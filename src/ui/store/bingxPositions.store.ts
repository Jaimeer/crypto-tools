import { defineStore } from 'pinia'
import { Position } from '../../server/Bingx.service'

type State = {
  positions: Position[]
  loading: boolean
  error: string | null
}

export const useBingXPositionsStore = defineStore('bingx.positions', {
  state: (): State => ({
    positions: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchPositions() {
      this.loading = true
      this.error = null

      try {
        const data = await window.electronAPI.getBingXPositions()
        console.log('fetchPositions', { t: data })
        this.positions = data
      } catch (error) {
        this.error = error.message || 'Failed to fetch positions'
        console.error('Error in store:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
