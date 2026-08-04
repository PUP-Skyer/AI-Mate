<template>
  <div class="dashboard-overview">
    <n-h1>管家看板 - 总览</n-h1>
    <n-spin :show="loading">
      <!-- 4 个统计卡片 -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card>
            <n-statistic label="总用户数" :value="stats.totalUsers ?? 0" />
          </n-card>
        </n-gi>
        <n-gi>
          <n-card>
            <n-statistic label="今日对话数" :value="stats.todayConversations ?? 0" />
          </n-card>
        </n-gi>
        <n-gi>
          <n-card>
            <n-statistic label="满意度">
              <template #default>
                {{ (stats.satisfaction ?? 0).toFixed(1) }}%
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card>
            <n-statistic label="待处理反馈" :value="stats.pendingFeedback ?? 0" />
          </n-card>
        </n-gi>
      </n-grid>

      <n-divider />

      <!-- 使用趋势 + 最近反馈 -->
      <n-grid :cols="2" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card title="使用趋势">
            <div
              style="height: 300px; display: flex; align-items: center; justify-content: center; background: #fafafa; border-radius: 4px;"
            >
              <n-text depth="3">图表区域（待接入 ECharts）</n-text>
            </div>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="最近反馈">
            <template #header-extra>
              <n-button text @click="$router.push('/feedback')">查看全部</n-button>
            </template>
            <n-list bordered>
              <n-list-item v-for="item in recentFeedback" :key="item.id">
                <n-thing>
                  <template #header>
                    <n-space align="center">
                      <n-tag :type="feedbackTypeMap[item.type]?.type || 'default'" size="small">
                        {{ feedbackTypeMap[item.type]?.label || item.type }}
                      </n-tag>
                      <n-tag :type="feedbackStatusMap[item.status]?.type || 'default'" size="small">
                        {{ feedbackStatusMap[item.status]?.label || item.status }}
                      </n-tag>
                    </n-space>
                  </template>
                  <template #description>
                    {{ item.content }}
                  </template>
                </n-thing>
              </n-list-item>
              <n-list-item v-if="recentFeedback.length === 0">
                <n-empty description="暂无反馈" />
              </n-list-item>
            </n-list>
          </n-card>
        </n-gi>
      </n-grid>

      <n-divider />

      <!-- 快捷入口 -->
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-button block @click="$router.push('/feedback')">反馈管理</n-button>
        </n-gi>
        <n-gi>
          <n-button block @click="$router.push('/faq')">FAQ 管理</n-button>
        </n-gi>
        <n-gi>
          <n-button block @click="$router.push('/user-growth')">用户增长</n-button>
        </n-gi>
        <n-gi>
          <n-button block @click="$router.push('/ai-usage')">AI 使用统计</n-button>
        </n-gi>
      </n-grid>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NButton,
  NCard,
  NDivider,
  NEmpty,
  NGrid,
  NGi,
  NH1,
  NList,
  NListItem,
  NSpace,
  NStatistic,
  NTag,
  NText,
  NThing,
  NSpin,
} from 'naive-ui'
import { getOverview, getFeedbacks, type OverviewStats, type Feedback } from '../services/butlerService'

const loading = ref(false)
const stats = ref<OverviewStats>({
  totalUsers: 0,
  todayConversations: 0,
  satisfaction: 0,
  pendingFeedback: 0,
})
const recentFeedback = ref<Feedback[]>([])

const feedbackTypeMap: Record<string, { label: string; type: 'default' | 'error' | 'warning' | 'success' | 'info' }> = {
  bug: { label: 'Bug', type: 'error' },
  feature: { label: '功能建议', type: 'info' },
  complaint: { label: '投诉', type: 'warning' },
  praise: { label: '表扬', type: 'success' },
}

const feedbackStatusMap: Record<string, { label: string; type: 'default' | 'error' | 'warning' | 'success' | 'info' }> = {
  pending: { label: '待处理', type: 'warning' },
  processing: { label: '处理中', type: 'info' },
  resolved: { label: '已解决', type: 'success' },
  closed: { label: '已关闭', type: 'default' },
}

onMounted(async () => {
  loading.value = true
  try {
    const [overviewData, feedbackData] = await Promise.all([
      getOverview(),
      getFeedbacks(),
    ])
    stats.value = overviewData
    recentFeedback.value = (feedbackData || []).slice(0, 5)
  } catch (e: any) {
    console.error('获取总览数据失败:', e)
  } finally {
    loading.value = false
  }
})
</script>
