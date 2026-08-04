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
        key: '/ai-chat',
        icon: renderIcon(CompassOutline),
      },
      {
        label: '军师',
        key: '/bp-gen',
        icon: renderIcon(BulbOutline),
      },
      {
        label: '工匠',
        key: '/collab',
        icon: renderIcon(HammerOutline),
      },
      {
        label: '管家',
        key: '/dashboard',
        icon: renderIcon(HomeOutline),
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
      {
        label: '数据看板',
        key: '/dashboard',
        icon: renderIcon(BarChartOutline),
      },
    ],
  },
]

function handleMenuSelect(key: string) {
  router.push(key)
}
</script>

<style scoped>
.app-sider {
  background-color: #fff;
}
</style>
