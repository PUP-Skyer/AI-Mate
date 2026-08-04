import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/profile',
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
  },
  {
    path: '/startup-profile',
    name: 'StartupProfile',
    component: () => import('../views/StartupProfile.vue'),
  },
  {
    path: '/membership',
    name: 'Membership',
    component: () => import('../views/Membership.vue'),
  },
  {
    path: '/security',
    name: 'Security',
    component: () => import('../views/Security.vue'),
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue'),
  },
]
