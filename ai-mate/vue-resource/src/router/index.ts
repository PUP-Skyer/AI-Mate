import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/resources',
  },
  {
    path: '/resources',
    name: 'ResourceList',
    component: () => import('../views/ResourceList.vue'),
  },
  {
    path: '/resources/:id',
    name: 'ResourceDetail',
    component: () => import('../views/ResourceDetail.vue'),
  },
  {
    path: '/search',
    name: 'SearchResult',
    component: () => import('../views/SearchResult.vue'),
  },
]
