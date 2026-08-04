<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <n-icon size="48" color="#A78BFA">
          <CompassOutline />
        </n-icon>
        <h1 class="login-title">青宸智汇</h1>
        <p class="login-subtitle">青宸智汇 · AI集群创投赋能平台</p>
      </div>

      <div class="login-card">
        <div class="login-left">
          <h2 class="portal-title">选择登录身份</h2>
          <div class="portal-grid">
            <button
              v-for="(portal, index) in portals"
              :key="portal.id"
              :class="['portal-card', { active: selectedPortal === portal.id }]"
              :style="getPortalStyle(portal)"
              @click="selectPortal(portal.id)"
            >
              <div class="portal-icon" :style="{ backgroundColor: portal.accentColor + '20' }">
                <component :is="portal.icon" :size="24" :color="portal.accentColor" />
              </div>
              <div class="portal-info">
                <h3 class="portal-name">{{ portal.title }}</h3>
                <p class="portal-desc">{{ portal.subtitle }}</p>
              </div>
              <div v-if="selectedPortal === portal.id" class="portal-check">
                <Checkmark :size="16" />
              </div>
            </button>
          </div>
        </div>

        <div class="login-right">
          <div class="role-indicator" :style="{ borderColor: currentPortal?.accentColor + '40', backgroundColor: currentPortal?.accentColor + '10' }">
            <component :is="currentPortal?.icon" :size="18" :color="currentPortal?.accentColor" />
            <span>正在以 <strong :style="{ color: currentPortal?.accentColor }">{{ currentPortal?.title }}</strong> 身份登录</span>
          </div>

          <h2 class="form-title">账号登录</h2>
          <n-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="left"
            size="large"
          >
            <n-form-item path="email" label="邮箱">
              <n-input
                v-model:value="formData.email"
                placeholder="请输入邮箱地址"
                @keyup.enter="handleLogin"
              />
            </n-form-item>

            <n-form-item path="password" label="密码">
              <n-input
                v-model:value="formData.password"
                type="password"
                show-password-on="click"
                placeholder="请输入密码"
                @keyup.enter="handleLogin"
              />
            </n-form-item>

            <n-button
              type="primary"
              block
              :loading="loading"
              :style="getButtonStyle()"
              @click="handleLogin"
            >
              <span>登录</span>
              <ArrowForwardOutline :size="16" />
            </n-button>
          </n-form>

          <div class="login-footer">
            还没有账号？
            <router-link to="/register" class="link" :style="{ color: currentPortal?.accentColor }">立即注册</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { CompassOutline, PeopleOutline, Wallet, StarOutline, SettingsOutline, ArrowForwardOutline, Checkmark } from '@vicons/ionicons5'
import type { FormInst, FormRules } from 'naive-ui'
import { login as loginApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/stores/user'

type PortalType = 'student' | 'investor' | 'expert' | 'admin'

interface PortalOption {
  id: PortalType
  icon: typeof GraduationCap
  title: string
  subtitle: string
  accentColor: string
}

const portals: PortalOption[] = [
  {
    id: 'student',
    icon: PeopleOutline,
    title: '学生端',
    subtitle: '创业者使用',
    accentColor: '#3B82F6',
  },
  {
    id: 'investor',
    icon: Wallet,
    title: '投资端',
    subtitle: '投资人使用',
    accentColor: '#10B981',
  },
  {
    id: 'expert',
    icon: StarOutline,
    title: '专家端',
    subtitle: '评审专家使用',
    accentColor: '#8B5CF6',
  },
  {
    id: 'admin',
    icon: SettingsOutline,
    title: '管理端',
    subtitle: '运营团队使用',
    accentColor: '#F59E0B',
  },
]

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const selectedPortal = ref<PortalType>('student')

const currentPortal = computed(() => portals.find(p => p.id === selectedPortal.value))

const formData = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

function selectPortal(id: PortalType) {
  selectedPortal.value = id
}

function getPortalStyle(portal: PortalOption) {
  const isActive = selectedPortal.value === portal.id
  return {
    borderColor: isActive ? portal.accentColor + '40' : 'transparent',
    backgroundColor: isActive ? portal.accentColor + '10' : '#1e293b',
  }
}

function getButtonStyle() {
  const portal = currentPortal.value
  if (!portal) return {}
  return {
    background: `linear-gradient(135deg, ${portal.accentColor}, ${portal.accentColor}dd)`,
    borderColor: portal.accentColor,
    boxShadow: `0 4px 16px ${portal.accentColor}30`,
  }
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const res: any = await loginApi({
      email: formData.email,
      password: formData.password,
    })

    const data = res.data
    const userInfo: UserInfo = {
      id: String(data.userId),
      email: data.email,
      nickname: data.nickname,
      role: data.role,
      username: data.nickname || data.email,
      avatar: '',
      roles: data.role ? [data.role] : [],
    }
    userStore.login(data.accessToken, userInfo, data.refreshToken)
    window.$message?.success('登录成功')
    router.push('/dashboard')
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '登录失败，请检查邮箱和密码'
    window.$message?.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(168,85,247,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168,85,247,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.login-container {
  width: 960px;
  max-width: 90vw;
  position: relative;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  margin-top: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #F8FAFC;
  letter-spacing: -0.5px;
}

.login-subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: #94A3B8;
}

.login-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.3);
}

.login-left {
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
}

.portal-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #E2E8F0;
}

.portal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
}

.portal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 12px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 300ms ease;
  text-align: center;
}

.portal-card:hover {
  transform: translateY(-2px);
}

.portal-card.active {
  transform: translateY(0);
}

.portal-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.portal-info {
  flex: 1;
}

.portal-name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #F8FAFC;
}

.portal-desc {
  margin: 0;
  font-size: 12px;
  color: #94A3B8;
}

.portal-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #22C55E;
}

.login-right {
  padding: 28px;
  background: rgba(255, 255, 255, 0.03);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
}

.role-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid;
  margin-bottom: 20px;
  font-size: 13px;
  color: #E2E8F0;
}

.role-indicator strong {
  font-weight: 600;
}

.form-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #E2E8F0;
}

.login-footer {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #94A3B8;
}

.link {
  font-weight: 500;
  text-decoration: none;
  transition: opacity 200ms;
}

.link:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .login-card {
    grid-template-columns: 1fr;
  }
  
  .login-right {
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
}
</style>