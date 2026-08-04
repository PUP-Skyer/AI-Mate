import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/overview',
  },
  {
    path: '/overview',
    name: 'DashboardOverview',
    component: () => import('../views/Overview.vue'),
  },
  {
    path: '/feedback',
    name: 'FeedbackList',
    component: () => import('../views/FeedbackList.vue'),
  },
  {
    path: '/faq',
    name: 'FAQManage',
    component: () => import('../views/FAQManage.vue'),
  },
  {
    path: '/user-growth',
    name: 'UserGrowth',
    component: () => import('../views/UserGrowth.vue'),
  },
  {
    path: '/revenue',
    name: 'Revenue',
    component: () => import('../views/Revenue.vue'),
  },
  {
    path: '/ai-usage',
    name: 'AIUsage',
    component: () => import('../views/AIUsage.vue'),
  },
]
