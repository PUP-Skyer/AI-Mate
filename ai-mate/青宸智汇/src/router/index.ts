import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/community',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/SubAppView.vue'),
        meta: { title: '数据看板', icon: 'bar-chart-outline', microApp: 'vue-dashboard' },
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('@/views/SubAppView.vue'),
        meta: { title: '社区', icon: 'people-outline', microApp: 'vue-community' },
      },
      {
        path: 'resource',
        name: 'Resource',
        component: () => import('@/views/SubAppView.vue'),
        meta: { title: '资源中心', icon: 'library-outline', microApp: 'vue-resource' },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/SubAppView.vue'),
        meta: { title: '用户中心', icon: 'person-outline', microApp: 'vue-user' },
      },
      {
        path: 'ai-chat',
        name: 'AIChat',
        component: () => import('@/views/SubAppView.vue'),
        meta: { title: 'AI 智聊', icon: 'chatbubbles-outline', microApp: 'react-ai-chat' },
      },
      {
        path: 'bp-gen',
        name: 'BPGen',
        component: () => import('@/views/SubAppView.vue'),
        meta: { title: '方案生成', icon: 'document-text-outline', microApp: 'react-bp-gen' },
      },
      {
        path: 'collab',
        name: 'Collab',
        component: () => import('@/views/SubAppView.vue'),
        meta: { title: '协作空间', icon: 'git-network-outline', microApp: 'react-collab' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = `${title} - 青宸智汇`
  }
  next()
})

export default router
