<template>
  <div class="user-growth">
    <n-h1>用户增长</n-h1>
    <n-card title="用户增长趋势">
      <n-space vertical>
        <v-chart :option="chartOption" style="height: 400px" autoresize />
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-statistic label="新增用户（30天）" :value="totalNewUsers" />
          </n-gi>
          <n-gi>
            <n-statistic label="今日新增" :value="todayNewUsers" />
          </n-gi>
          <n-gi>
            <n-statistic label="日均新增" :value="avgNewUsers">
              <template #suffix>人</template>
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
import { getUserGrowth } from '../api'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
])

const growthData = ref<Array<{ date: string; count: number }>>([])

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: growthData.value.map((item) => item.date),
    axisLabel: {
      rotate: 45,
      formatter: (val: string) => val.slice(5),
    },
  },
  yAxis: {
    type: 'value',
    name: '新增用户数',
  },
  series: [
    {
      name: '新增用户',
      type: 'line',
      data: growthData.value.map((item) => item.count),
      smooth: true,
      areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#2080f0' },
    },
  ],
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true,
  },
}))

const totalNewUsers = computed(() => growthData.value.reduce((sum, item) => sum + item.count, 0))
const todayNewUsers = computed(() => {
  if (growthData.value.length === 0) return 0
  return growthData.value[growthData.value.length - 1].count
})
const avgNewUsers = computed(() => {
  if (growthData.value.length === 0) return 0
  return Math.round(totalNewUsers.value / growthData.value.length)
})

onMounted(async () => {
  try {
    growthData.value = await getUserGrowth(30)
  } catch (e: any) {
    console.error('获取用户增长数据失败:', e)
  }
})
</script>
