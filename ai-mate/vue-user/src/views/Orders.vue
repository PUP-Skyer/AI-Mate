<template>
  <div class="orders">
    <n-h1>订单管理</n-h1>
    <n-space vertical>
      <n-tabs v-model:value="activeTab" type="line">
        <n-tab-pane name="all" tab="全部订单" />
        <n-tab-pane name="pending" tab="待支付" />
        <n-tab-pane name="completed" tab="已完成" />
        <n-tab-pane name="refunded" tab="已退款" />
      </n-tabs>
      <n-list bordered>
        <n-list-item v-for="i in 5" :key="i">
          <n-thing>
            <template #header>
              <n-space>
                <span>订单号: ORD-20240{{ 100 + i }}</span>
                <n-tag :type="i % 3 === 0 ? 'success' : i % 3 === 1 ? 'warning' : 'info'">
                  {{ i % 3 === 0 ? '已完成' : i % 3 === 1 ? '待支付' : '已退款' }}
                </n-tag>
              </n-space>
            </template>
            <template #description>
              <n-p>专业版会员订阅 - ¥99/月</n-p>
              <n-p>下单时间：2024-01-{{ 10 + i }}</n-p>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NH1, NList, NListItem, NP, NSpace, NTabPane, NTabs, NTag, NThing } from 'naive-ui'

const activeTab = ref('all')
</script>
