<template>
  <div class="ai-usage">
    <n-h1>AI 使用统计</n-h1>
    <n-card title="AI 调用统计">
      <n-space vertical>
        <v-chart :option="chartOption" style="height: 400px" autoresize />
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-statistic label="总调用次数" :value="totalCount" />
          </n-gi>
          <n-gi>
            <n-statistic label="今日调用" :value="todayCount" />
          </n-gi>
          <n-gi>
            <n-statistic label="日均调用" :value="avgCount">
              <template #suffix>次</template>
            </n-statistic>
          </n-gi>
        </n-grid>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NGrid, NGi, NH1, NSpace, NStatistic } from 'naive-ui'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { getAIUsage } from '../api'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
])

const usageData = ref<Array<{ date: string; count: number }>>([])

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: usageData.value.map((item) => item.date),
    axisLabel: {
      rotate: 45,
      formatter: (val: string) => val.slice(5),
    },
  },
  yAxis: {
    type: 'value',
    name: '使用次数',
  },
  series: [
    {
      name: 'AI 使用次数',
      type: 'line',
      data: usageData.value.map((item) => item.count),
      smooth: true,
      areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#18a058' },
    },
  ],
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true,
  },
}))

const totalCount = computed(() => usageData.value.reduce((sum, item) => sum + item.count, 0))
const todayCount = computed(() => {
  if (usageData.value.length === 0) return 0
  return usageData.value[usageData.value.length - 1].count
})
const avgCount = computed(() => {
  if (usageData.value.length === 0) return 0
  return Math.round(totalCount.value / usageData.value.length)
})

onMounted(async () => {
  try {
    usageData.value = await getAIUsage(30)
  } catch (e: any) {
    console.error('获取AI使用统计失败:', e)
  }
})
</script>
