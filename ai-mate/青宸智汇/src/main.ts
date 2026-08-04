import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerMicroApps, start, initGlobalState } from 'qiankun'
import { apps } from './micro/apps'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化 qiankun 全局状态
const { onGlobalStateChange, setGlobalState } = initGlobalState({
  user: null,
  token: '',
})

// 监听全局状态变化
onGlobalStateChange((state, prev) => {
  console.log('[Main] Global state changed:', state, prev)
})

// 如果有 token，尝试恢复用户信息并同步 qiankun 状态
function restoreUserSession() {
  const userStore = useUserStore()
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchUserInfo().then(() => {
      // 同步当前状态到 qiankun
      setGlobalState({
        user: userStore.userInfo,
        token: userStore.token,
      })
    }).catch((error) => {
      console.warn('[Main] Failed to restore user session:', error)
      userStore.logout()
    })
  } else {
    // 同步当前状态到 qiankun
    setGlobalState({
      user: userStore.userInfo,
      token: userStore.token,
    })
  }
}

// 注册子应用
registerMicroApps(apps, {
  beforeLoad: [
    async (app) => {
      console.log(`[Main] Loading ${app.name}...`)
    },
  ],
  beforeMount: [
    async (app) => {
      console.log(`[Main] Mounting ${app.name}...`)
    },
  ],
  afterMount: [
    async (app) => {
      console.log(`[Main] ${app.name} mounted`)
    },
  ],
  afterUnmount: [
    async (app) => {
      console.log(`[Main] ${app.name} unmounted`)
    },
  ],
})

// 启动 qiankun
start({
  prefetch: 'all',
  sandbox: {
    strictStyleIsolation: true,
    experimentalStyleIsolation: false,
  },
})

// 恢复用户会话
restoreUserSession()

app.mount('#app')

export { onGlobalStateChange, setGlobalState }
