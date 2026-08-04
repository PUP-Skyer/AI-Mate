import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/posts',
  },
  {
    path: '/posts',
    name: 'PostList',
    component: () => import('../views/PostList.vue'),
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: () => import('../views/PostDetail.vue'),
  },
  {
    path: '/create-post',
    name: 'CreatePost',
    component: () => import('../views/CreatePost.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
  },
]
