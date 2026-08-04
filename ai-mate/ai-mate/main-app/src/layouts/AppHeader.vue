<template>
  <n-layout-header bordered class="app-header">
    <div class="header-left">
      <div class="logo" @click="router.push('/')">
        <n-icon size="28" color="#18a058">
          <logo-vue />
        </n-icon>
        <span class="logo-text">青宸智汇</span>
      </div>
    </div>

    <div class="header-center">
      <n-menu
        mode="horizontal"
        :value="activeMenu"
        :options="headerMenuOptions"
        @update:value="handleMenuSelect"
      />
    </div>

    <div class="header-right">
      <template v-if="userStore.isLoggedIn">
        <n-dropdown :options="userDropdownOptions" @select="handleUserAction">
          <div class="user-info">
            <n-avatar round size="small" :src="userStore.avatar || undefined">
              {{ userStore.username?.charAt(0)?.toUpperCase() }}
            </n-avatar>
            <span class="username">{{ userStore.username }}</span>
          </div>
        </n-dropdown>
      </template>
      <template v-else>
        <n-button type="primary" size="small" @click="handleLogin">
          登录
        </n-button>
      </template>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon, NLayoutHeader, NMenu, NDropdown, NAvatar, NButton } from 'naive-ui'
import {
  LogoVue,
  ChatbubblesOutline,
  DocumentTextOutline,
  GitNetworkOutline,
} from '@vicons/ionicons5'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })

const headerMenuOptions = [
  {
    label: 'AI 智聊',
    key: '/ai-chat',
    icon: renderIcon(ChatbubblesOutline),
  },
  {
    label: '方案生成',
    key: '/bp-gen',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: '协作空间',
    key: '/collab',
    icon: renderIcon(GitNetworkOutline),
  },
]

const userDropdownOptions = [
  { label: '个人中心', key: 'profile' },
  { label: '设置', key: 'settings' },
  { type: 'divider' as const, key: 'd1' },
  { label: '退出登录', key: 'logout' },
]

function handleMenuSelect(key: string) {
  router.push(key)
}

function handleUserAction(key: string) {
  switch (key) {
    case 'profile':
      router.push('/user')
      break
    case 'logout':
      userStore.logout()
      router.push('/')
      break
  }
}

function handleLogin() {
  router.push('/user')
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #18a058;
  letter-spacing: 1px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}
</style>
