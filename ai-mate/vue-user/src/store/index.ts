import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref({
    username: '',
    email: '',
    avatar: '',
  })
  const loading = ref(false)

  return {
    userInfo,
    loading,
  }
})
