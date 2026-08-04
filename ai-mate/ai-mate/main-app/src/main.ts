import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 暂时注释掉 qiankun 相关代码，以解决构建问题
/*
import { registerMicroApps, start, initGlobalState } from 'qiankun'
import { apps } from './micro/apps'

// 初始化 qiankun 全局状态
const { onGlobalStateChange, setGlobalState } = initGlobalState({
  user: null,
  token: '',
})

// 监听全局状态变化
onGlobalStateChange((state, prev) => {
  console.log('[Main] Global state changed:', state, prev)
})

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

export { onGlobalStateChange, setGlobalState }
*/

app.mount('#app')
