import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes } from './router'
import { createRouter, createWebHistory } from 'vue-router'

let app: any = null
let router: any = null

function render(props: Record<string, any> = {}) {
  const { container } = props
  router = createRouter({
    history: createWebHistory('/community'),
    routes,
  })

  app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}

export async function bootstrap() {
  console.log('[vue-community] bootstrap')
}

export async function mount(props: Record<string, any>) {
  console.log('[vue-community] mount', props)
  render(props)
}

export async function unmount() {
  console.log('[vue-community] unmount')
  app?.unmount()
  app = null
  router = null
}
