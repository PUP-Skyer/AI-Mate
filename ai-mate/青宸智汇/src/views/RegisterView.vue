<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <n-icon size="48" color="#18a058">
          <logo-vue />
        </n-icon>
        <h1 class="register-title">青宸智汇</h1>
        <p class="register-subtitle">创建你的账号</p>
      </div>

      <n-card class="register-card">
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
            />
          </n-form-item>

          <n-form-item path="nickname" label="昵称">
            <n-input
              v-model:value="formData.nickname"
              placeholder="请输入昵称（可选）"
            />
          </n-form-item>

          <n-form-item path="password" label="密码">
            <n-input
              v-model:value="formData.password"
              type="password"
              show-password-on="click"
              placeholder="最少8位，包含字母和数字"
              @input="handlePasswordInput"
            />
          </n-form-item>

          <n-form-item path="confirmPassword" label="确认密码">
            <n-input
              v-model:value="formData.confirmPassword"
              type="password"
              show-password-on="click"
              placeholder="请再次输入密码"
              @keyup.enter="handleRegister"
            />
          </n-form-item>

          <n-button
            type="primary"
            block
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </n-button>
        </n-form>

        <div class="register-footer">
          已有账号？
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { LogoVue } from '@vicons/ionicons5'
import type { FormInst, FormRules, FormItemRule } from 'naive-ui'
import { register as registerApi, login as loginApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formData = reactive({
  email: '',
  nickname: '',
  password: '',
  confirmPassword: '',
})

function validatePasswordSame(_rule: FormItemRule, value: string): boolean {
  return value === formData.password
}

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
      message: '密码需包含字母和数字',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePasswordSame, message: '两次输入的密码不一致', trigger: 'blur' },
  ],
}

function handlePasswordInput() {
  if (formData.confirmPassword) {
    formRef.value?.validate(
      undefined,
      (ruleItem) => ruleItem?.key === 'confirmPassword'
    )
  }
}

async function handleRegister() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    // 注册
    await registerApi({
      email: formData.email,
      password: formData.password,
      nickname: formData.nickname || undefined,
    })

    window.$message.success('注册成功，正在自动登录...')

    // 自动登录
    const loginRes: any = await loginApi({
      email: formData.email,
      password: formData.password,
    })

    const { token, refreshToken, user } = loginRes.data
    userStore.login(token, user as UserInfo, refreshToken)
    window.$message.success('登录成功')
    router.push('/dashboard')
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '注册失败，请稍后重试'
    window.$message?.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-container {
  width: 400px;
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.register-title {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2px;
}

.register-subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.register-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.register-footer {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #999;
}

.link {
  color: #18a058;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
