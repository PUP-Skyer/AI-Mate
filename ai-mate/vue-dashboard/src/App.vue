<template>
  <n-config-provider>
    <n-message-provider>
      <n-layout style="min-height: 100vh">
        <n-layout-header style="display: flex; align-items: center; padding: 0 24px; border-bottom: 1px solid #efeff5; background: #fff;">
          <n-h3 style="margin: 12px 24px 12px 0;">青宸智汇 - 管家</n-h3>
          <n-menu mode="horizontal" :value="currentRoute" :options="menuOptions" @update:value="handleMenuClick" />
        </n-layout-header>
        <n-layout-content style="padding: 24px; background: #f5f5f5;">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NConfigProvider, NMessageProvider, NLayout, NLayoutHeader, NLayoutContent, NH3, NMenu } from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path)

const menuOptions: MenuOption[] = [
  { label: '总览', key: '/overview' },
  { label: '反馈管理', key: '/feedback' },
  { label: 'FAQ 管理', key: '/faq' },
  { label: '用户增长', key: '/user-growth' },
  { label: 'AI 使用', key: '/ai-usage' },
]

const handleMenuClick = (key: string) => {
  router.push(key)
}
</script>
