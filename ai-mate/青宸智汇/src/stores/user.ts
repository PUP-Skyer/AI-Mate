import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserProfile } from '@/api/user'

export interface UserInfo {
  id: string
  username: string
  avatar: string
  email: string
  roles: string[]
  role?: string
  phone?: string
  stage?: string
  industry?: string
  productType?: string
  teamSize?: string
  preferences?: string
  nickname?: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('ai-mate-token') || '')
  const refreshToken = ref<string>(localStorage.getItem('ai-mate-refresh-token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('ai-mate-token', newToken)
  }

  function setRefreshToken(newRefreshToken: string) {
    refreshToken.value = newRefreshToken
    localStorage.setItem('ai-mate-refresh-token', newRefreshToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function login(authToken: string, info: UserInfo, refreshTokenValue?: string) {
    setToken(authToken)
    setUserInfo(info)
    if (refreshTokenValue) {
      setRefreshToken(refreshTokenValue)
    }
    // 同步 qiankun 全局状态
    syncGlobalState()
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    localStorage.removeItem('ai-mate-token')
    localStorage.removeItem('ai-mate-refresh-token')
    // 同步 qiankun 全局状态
    syncGlobalState()
  }

  async function fetchUserInfo(): Promise<UserInfo> {
    const res: any = await getUserProfile()
    const info = res.data as UserInfo
    setUserInfo(info)
    return info
  }

  function syncGlobalState() {
    // 动态导入以避免循环依赖，仅在运行时调用
    import('../main').then(({ setGlobalState }) => {
      setGlobalState({
        user: userInfo.value,
        token: token.value,
      })
    }).catch(() => {
      // 静默处理，可能在测试环境中
    })
  }

  return {
    token,
    refreshToken,
    userInfo,
    isLoggedIn,
    username,
    avatar,
    setToken,
    setRefreshToken,
    setUserInfo,
    login,
    logout,
    fetchUserInfo,
  }
})
