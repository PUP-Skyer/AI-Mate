import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '数据看板', icon: 'bar-chart-outline' },
      },
      {
        path: 'ai-chat',
        name: 'AIChat',
        component: () => import('@/views/ScoutView.vue'),
        meta: { title: 'AI 智聊', icon: 'chatbubbles-outline' },
      },
      {
        path: 'bp-gen',
        name: 'BPGen',
        component: () => import('@/views/PageView.vue'),
        meta: { title: '方案生成', icon: 'document-text-outline' },
      },
      {
        path: 'collab',
        name: 'Collab',
        component: () => import('@/views/PageView.vue'),
        meta: { title: '协作空间', icon: 'git-network-outline' },
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('@/views/PageView.vue'),
        meta: { title: '社区', icon: 'people-outline' },
      },
      {
        path: 'resource',
        name: 'Resource',
        component: () => import('@/views/PageView.vue'),
        meta: { title: '资源中心', icon: 'library-outline' },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/PageView.vue'),
        meta: { title: '用户中心', icon: 'person-outline' },
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