import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref({
    totalUsers: 0,
    totalRevenue: 0,
    activeUsers: 0,
    aiUsageCount: 0,
  })
  const loading = ref(false)

  return {
    stats,
    loading,
  }
})
