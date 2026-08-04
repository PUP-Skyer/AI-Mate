<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="220"
    :collapsed="collapsed"
    show-trigger
    @collapse="collapsed = true"
    @expand="collapsed = false"
    class="app-sider"
  >
    <n-menu
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="sidebarMenuOptions"
      :value="activeMenu"
      @update:value="handleMenuSelect"
    />
  </n-layout-sider>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon, NLayoutSider, NMenu } from 'naive-ui'
import {
  CompassOutline,
  BulbOutline,
  HammerOutline,
  HomeOutline,
  LibraryOutline,
  PeopleOutline,
  BarChartOutline,
  ChatbubbleOutline,
  DocumentTextOutline,
  ConstructOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const activeMenu = computed(() => route.path)

const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })

const sidebarMenuOptions = [
  {
    label: 'AI 数字员工',
    key: 'ai-staff-group',
    type: 'group' as const,
    children: [
      {
        label: '探路者',
        key: '/ai-chat?role=scout',
        icon: renderIcon(CompassOutline),
      },
      {
        label: '军师',
        key: 'sage-group',
        icon: renderIcon(BulbOutline),
        children: [
          {
            label: 'AI 对话',
            key: '/ai-chat?role=sage',
            icon: renderIcon(ChatbubbleOutline),
          },
          {
            label: '策略工作台',
            key: '/bp-gen',
            icon: renderIcon(DocumentTextOutline),
          },
        ],
      },
      {
        label: '工匠',
        key: 'maker-group',
        icon: renderIcon(HammerOutline),
        children: [
          {
            label: 'AI 对话',
            key: '/ai-chat?role=maker',
            icon: renderIcon(ChatbubbleOutline),
          },
          {
            label: '创作工作台',
            key: '/collab',
            icon: renderIcon(ConstructOutline),
          },
        ],
      },
      {
        label: '管家',
        key: 'butler-group',
        icon: renderIcon(HomeOutline),
        children: [
          {
            label: 'AI 对话',
            key: '/ai-chat?role=butler',
            icon: renderIcon(ChatbubbleOutline),
          },
          {
            label: '管理看板',
            key: '/butler-dashboard',
            icon: renderIcon(BarChartOutline),
          },
        ],
      },
    ],
  },
  {
    label: '平台功能',
    key: 'platform-group',
    type: 'group' as const,
    children: [
      {
        label: '资源中心',
        key: '/resource',
        icon: renderIcon(LibraryOutline),
      },
      {
        label: '社区',
        key: '/community',
        icon: renderIcon(PeopleOutline),
      },
    ],
  },
]

function handleMenuSelect(key: string) {
  if (key.startsWith('/ai-chat?')) {
    const [path, query] = key.split('?')
    router.push({ path, query: Object.fromEntries(new URLSearchParams(query)) })
  } else {
    router.push(key)
  }
}
</script>

<style scoped>
.app-sider {
  background-color: #fff;
}
</style>