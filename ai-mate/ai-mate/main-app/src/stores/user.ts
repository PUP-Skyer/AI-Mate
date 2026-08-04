import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: string
  username: string
  avatar: string
  email: string
  roles: string[]
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('ai-mate-token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('ai-mate-token', newToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function login(authToken: string, info: UserInfo) {
    setToken(authToken)
    setUserInfo(info)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('ai-mate-token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    username,
    avatar,
    setToken,
    setUserInfo,
    login,
    logout,
  }
})
