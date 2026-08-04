<template>
  <div class="page-view">
    <div class="page-header">
      <n-icon size="48" :color="iconColor">
        <component :is="iconComponent" />
      </n-icon>
      <h2>{{ pageTitle }}</h2>
    </div>
    <n-card class="page-content">
      <template #header>
        <span>功能页面</span>
      </template>
      <div class="content-body">
        <n-result
          :status="status"
          :title="resultTitle"
          :description="resultDescription"
        >
          <template #icon>
            <n-icon size="64" :color="iconColor">
              <component :is="iconComponent" />
            </n-icon>
          </template>
          <template #footer>
            <n-space justify="center">
              <n-button type="primary" @click="goHome">
                返回首页
              </n-button>
            </n-space>
          </template>
        </n-result>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChatbubblesOutline,
  DocumentTextOutline,
  GitNetworkOutline,
  PeopleOutline,
  LibraryOutline,
  PersonOutline,
  HammerOutline,
} from '@vicons/ionicons5'
import { NIcon, NCard, NResult, NButton, NSpace } from 'naive-ui'

const route = useRoute()
const router = useRouter()

const pageConfig = computed(() => {
  const path = route.path
  const configs: Record<string, any> = {
    '/ai-chat': {
      title: 'AI 智聊',
      icon: ChatbubblesOutline,
      color: '#18a058',
      status: 'info',
    },
    '/bp-gen': {
      title: '方案生成',
      icon: DocumentTextOutline,
      color: '#f08c00',
      status: 'warning',
    },
    '/collab': {
      title: '协作空间',
      icon: GitNetworkOutline,
      color: '#2080f0',
      status: 'info',
    },
    '/community': {
      title: '社区',
      icon: PeopleOutline,
      color: '#8a2be2',
      status: 'info',
    },
    '/resource': {
      title: '资源中心',
      icon: LibraryOutline,
      color: '#18a058',
      status: 'info',
    },
    '/user': {
      title: '用户中心',
      icon: PersonOutline,
      color: '#8a2be2',
      status: 'info',
    },
  }
  return configs[path] || {
    title: '页面',
    icon: HammerOutline,
    color: '#999',
    status: 'info',
  }
})

const pageTitle = computed(() => pageConfig.value.title)
const iconComponent = computed(() => pageConfig.value.icon)
const iconColor = computed(() => pageConfig.value.color)
const status = computed(() => pageConfig.value.status)

const resultTitle = computed(() => `${pageTitle.value} - 功能开发中`)
const resultDescription = computed(() => `抱歉，${pageTitle.value}功能正在开发中，请稍后再试。`)

function goHome() {
  router.push('/dashboard')
}
</script>

<style scoped>
.page-view {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.page-content {
  margin-bottom: 24px;
}

.content-body {
  padding: 32px 0;
}
</style>