<template>
  <div class="membership">
    <n-h1>会员订阅</n-h1>
    <n-grid :cols="3" :x-gap="16" :y-gap="16">
      <n-gi v-for="plan in plans" :key="plan.name">
        <n-card :title="plan.name">
          <n-space vertical>
            <n-h2>{{ plan.price }}</n-h2>
            <n-p>{{ plan.description }}</n-p>
            <n-divider />
            <n-list bordered>
              <n-list-item v-for="feature in plan.features" :key="feature">
                {{ feature }}
              </n-list-item>
            </n-list>
            <n-button :type="plan.recommended ? 'primary' : 'default'" block>
              {{ plan.recommended ? '立即订阅' : '选择方案' }}
            </n-button>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { NButton, NCard, NDivider, NGrid, NGi, NH1, NH2, NList, NListItem, NP, NSpace } from 'naive-ui'

const plans = [
  {
    name: '免费版',
    price: '免费',
    description: '适合个人用户体验',
    recommended: false,
    features: ['基础功能', '社区访问', '每月 10 次 AI 调用'],
  },
  {
    name: '专业版',
    price: '¥99/月',
    description: '适合创业者和小团队',
    recommended: true,
    features: ['全部基础功能', '高级数据分析', '无限 AI 调用', '优先客服'],
  },
  {
    name: '企业版',
    price: '¥499/月',
    description: '适合中大型创业团队',
    recommended: false,
    features: ['全部专业功能', '团队协作', 'API 接入', '专属客户经理', '定制化服务'],
  },
]
</script>
