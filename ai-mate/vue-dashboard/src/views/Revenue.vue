<template>
  <div class="revenue">
    <n-h1>收入统计</n-h1>
    <n-card title="收入趋势">
      <n-space vertical>
        <n-date-picker v-model:value="dateRange" type="daterange" />
        <n-empty description="收入趋势图表区域（待接入 ECharts 等图表库）" />
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-statistic label="本月收入" :value="28600" prefix="¥" />
          </n-gi>
          <n-gi>
            <n-statistic label="环比增长" :value="12.3">
              <template #suffix>%</template>
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="付费用户" :value="856" />
          </n-gi>
        </n-grid>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NDatePicker, NEmpty, NGrid, NGi, NH1, NSpace, NStatistic } from 'naive-ui'

const dateRange = ref(null)
</script>
