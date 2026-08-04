<template>
  <div class="feedback-list">
    <n-h1>反馈管理</n-h1>
    <n-card>
      <template #header>
        <n-space align="center">
          <n-text strong>反馈列表</n-text>
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="按状态筛选"
            clearable
            style="width: 150px"
            @update:value="handleFilterChange"
          />
        </n-space>
      </template>
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="filteredFeedbacks"
          :pagination="{ pageSize: 10 }"
          :bordered="false"
        />
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import {
  NCard,
  NH1,
  NSpace,
  NSelect,
  NSpin,
  NTag,
  NText,
  NDataTable,
  NButton,
  useMessage,
} from 'naive-ui'
import { getFeedbacks, type Feedback } from '../services/butlerService'

const message = useMessage()
const loading = ref(false)
const feedbacks = ref<Feedback[]>([])
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' },
]

const typeMap: Record<string, { label: string; type: 'default' | 'error' | 'warning' | 'success' | 'info' }> = {
  bug: { label: 'Bug', type: 'error' },
  feature: { label: '功能建议', type: 'info' },
  complaint: { label: '投诉', type: 'warning' },
  praise: { label: '表扬', type: 'success' },
}

const statusMap: Record<string, { label: string; type: 'default' | 'error' | 'warning' | 'success' | 'info' }> = {
  pending: { label: '待处理', type: 'warning' },
  processing: { label: '处理中', type: 'info' },
  resolved: { label: '已解决', type: 'success' },
  closed: { label: '已关闭', type: 'default' },
}

const columns = [
  {
    title: '类型',
    key: 'type',
    width: 100,
    render: (row: Feedback) =>
      h(NTag, { type: typeMap[row.type]?.type || 'default', size: 'small' }, () => typeMap[row.type]?.label || row.type),
  },
  {
    title: '内容',
    key: 'content',
    ellipsis: { tooltip: true },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: Feedback) =>
      h(NTag, { type: statusMap[row.status]?.type || 'default', size: 'small' }, () => statusMap[row.status]?.label || row.status),
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row: Feedback) => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
]

const filteredFeedbacks = computed(() => {
  if (!statusFilter.value) return feedbacks.value
  return feedbacks.value.filter((f) => f.status === statusFilter.value)
})

const handleFilterChange = () => {
  // 筛选由 computed 自动处理
}

const fetchFeedbacks = async () => {
  loading.value = true
  try {
    feedbacks.value = await getFeedbacks()
  } catch (e: any) {
    message.error('获取反馈列表失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchFeedbacks)
</script>
