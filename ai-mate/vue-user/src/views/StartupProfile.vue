<template>
  <div class="startup-profile">
    <n-h1>创业档案</n-h1>
    <n-spin :show="loading">
      <n-card>
        <n-form>
          <n-form-item label="所属行业">
            <n-select v-model:value="form.industry" :options="industryOptions" placeholder="请选择行业" />
          </n-form-item>
          <n-form-item label="创业阶段">
            <n-select v-model:value="form.stage" :options="stageOptions" placeholder="请选择阶段" />
          </n-form-item>
          <n-form-item label="产品类型">
            <n-select v-model:value="form.productType" :options="productTypeOptions" placeholder="请选择产品类型" />
          </n-form-item>
          <n-form-item label="团队规模">
            <n-select v-model:value="form.teamSize" :options="teamSizeOptions" placeholder="请选择团队规模" />
          </n-form-item>
          <n-form-item label="偏好/备注">
            <n-input v-model:value="form.preferences" type="textarea" placeholder="请输入偏好或备注信息" :rows="4" />
          </n-form-item>
          <n-button type="primary" :loading="saving" @click="handleSave">保存档案</n-button>
        </n-form>
      </n-card>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NInput, NSelect, NH1, NSpin } from 'naive-ui'
import { getStartupProfile, updateStartupProfile } from '../api'

const message = useMessage()
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  industry: null as string | null,
  stage: null as string | null,
  productType: null as string | null,
  teamSize: null as string | null,
  preferences: '',
})

const industryOptions = [
  { label: '人工智能', value: 'ai' },
  { label: '电子商务', value: 'ecommerce' },
  { label: '金融科技', value: 'fintech' },
  { label: '教育培训', value: 'education' },
  { label: '医疗健康', value: 'healthcare' },
]

const stageOptions = [
  { label: '创意阶段', value: 'idea' },
  { label: '种子轮', value: 'seed' },
  { label: '天使轮', value: 'angel' },
  { label: 'A 轮', value: 'series-a' },
  { label: 'B 轮及以上', value: 'series-b+' },
]

const productTypeOptions = [
  { label: 'SaaS', value: 'saas' },
  { label: '移动应用', value: 'mobile-app' },
  { label: '硬件产品', value: 'hardware' },
  { label: '平台/市场', value: 'platform' },
  { label: '咨询服务', value: 'consulting' },
]

const teamSizeOptions = [
  { label: '1-5 人', value: '1-5' },
  { label: '6-20 人', value: '6-20' },
  { label: '21-50 人', value: '21-50' },
  { label: '51-200 人', value: '51-200' },
  { label: '200 人以上', value: '200+' },
]

async function fetchStartupProfile() {
  loading.value = true
  try {
    const profile = await getStartupProfile()
    form.industry = profile.industry || null
    form.stage = profile.stage || null
    form.productType = profile.productType || null
    form.teamSize = profile.teamSize || null
    form.preferences = profile.preferences || ''
  } catch (e: any) {
    console.error('加载创业档案失败:', e.message)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const updated = await updateStartupProfile({
      stage: form.stage || undefined,
      industry: form.industry || undefined,
      productType: form.productType || undefined,
      teamSize: form.teamSize || undefined,
      preferences: form.preferences.trim() || undefined,
    })
    form.industry = updated.industry || null
    form.stage = updated.stage || null
    form.productType = updated.productType || null
    form.teamSize = updated.teamSize || null
    form.preferences = updated.preferences || ''
    message.success('保存成功')
  } catch (e: any) {
    message.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchStartupProfile()
})
</script>
