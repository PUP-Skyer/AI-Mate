<template>
  <div class="profile">
    <n-h1>个人资料</n-h1>
    <n-spin :show="loading">
      <n-card>
        <n-form>
          <n-form-item label="头像">
            <n-avatar round size="large" :src="form.avatar || undefined">
              {{ form.nickname?.charAt(0) || 'U' }}
            </n-avatar>
          </n-form-item>
          <n-form-item label="头像 URL">
            <n-input v-model:value="form.avatar" placeholder="请输入头像 URL" />
          </n-form-item>
          <n-form-item label="昵称">
            <n-input v-model:value="form.nickname" placeholder="请输入昵称" />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input v-model:value="form.email" placeholder="请输入邮箱" disabled />
          </n-form-item>
          <n-form-item label="个人简介">
            <n-input v-model:value="form.bio" type="textarea" placeholder="请输入个人简介" :rows="4" />
          </n-form-item>
          <n-button type="primary" :loading="saving" @click="handleSave">保存修改</n-button>
        </n-form>
      </n-card>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { NAvatar, NButton, NCard, NForm, NFormItem, NInput, NH1, NSpin } from 'naive-ui'
import { getUserProfile, updateProfile } from '../api'

const message = useMessage()
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  nickname: '',
  avatar: '',
  email: '',
  bio: '',
})

async function fetchProfile() {
  loading.value = true
  try {
    const profile = await getUserProfile()
    form.nickname = profile.nickname || ''
    form.avatar = profile.avatar || ''
    form.email = profile.email || ''
    form.bio = profile.bio || ''
  } catch (e: any) {
    console.error('加载用户资料失败:', e.message)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!form.nickname.trim()) {
    message.warning('请输入昵称')
    return
  }

  saving.value = true
  try {
    const updated = await updateProfile({
      nickname: form.nickname.trim(),
      avatar: form.avatar.trim() || undefined,
    })
    form.nickname = updated.nickname || ''
    form.avatar = updated.avatar || ''
    message.success('保存成功')
  } catch (e: any) {
    message.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>
