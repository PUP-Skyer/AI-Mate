import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useResourceStore = defineStore('resource', () => {
  const resources = ref<any[]>([])
  const currentResource = ref<any>(null)
  const loading = ref(false)

  return {
    resources,
    currentResource,
    loading,
  }
})
