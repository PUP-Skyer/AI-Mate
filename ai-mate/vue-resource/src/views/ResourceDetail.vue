<template>
  <div class="resource-detail">
    <n-button text @click="$router.back()">返回列表</n-button>
    <n-spin :show="loading">
      <template v-if="template">
        <n-h1>{{ template.name }}</n-h1>
        <n-card>
          <n-space align="center" size="small" style="margin-bottom: 12px">
            <n-tag :type="categoryTagType(template.category)">
              {{ categoryLabel(template.category) }}
            </n-tag>
            <n-text depth="3">使用次数: {{ template.usageCount || 0 }}</n-text>
            <n-text depth="3">更新时间: {{ formatDate(template.updatedAt) }}</n-text>
          </n-space>

          <n-divider />

          <n-h3>资源介绍</n-h3>
          <n-p style="white-space: pre-wrap; line-height: 1.8">{{ template.description }}</n-p>

          <n-divider />

          <n-h3>System Prompt 预览</n-h3>
          <n-card embedded style="background: #f5f5f5">
            <n-code :code="template.systemPrompt" language="text" word-wrap />
          </n-card>
        </n-card>
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton, NCard, NH1, NH3, NP, NDivider, NSpace,
  NTag, NText, NSpin, NCode,
} from 'naive-ui'
import { getTemplateDetail, type TemplateDetail } from '../api'

const route = useRoute()
const templateId = Number(route.params.id)

const template = ref<TemplateDetail | null>(null)
const loading = ref(false)

const categoryOptions = [
  { label: '商业计划', value: 'business-plan' },
  { label: '市场分析', value: 'market-analysis' },
  { label: '融资材料', value: 'fundraising' },
  { label: '产品文档', value: 'product-doc' },
  { label: '运营模板', value: 'operation' },
]

function categoryLabel(cat: string): string {
  return categoryOptions.find((c) => c.value === cat)?.label || cat
}

function categoryTagType(cat: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    'business-plan': 'success',
    'market-analysis': 'info',
    'fundraising': 'warning',
    'product-doc': 'error',
    'operation': 'default',
  }
  return map[cat] || 'default'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function fetchTemplate() {
  loading.value = true
  try {
    template.value = await getTemplateDetail(templateId)
  } catch (e: any) {
    console.error('加载资源详情失败:', e.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTemplate()
})
</script>
