<template>
  <div class="profile">
    <n-h1>个人主页</n-h1>
    <n-card>
      <n-space vertical>
        <n-avatar round size="large">U</n-avatar>
        <n-h3>用户名</n-h3>
        <n-p>个人简介区域</n-p>
        <n-divider />
        <n-h4>我的帖子</n-h4>
        <n-list bordered>
          <n-list-item v-for="i in 3" :key="i">
            <n-thing :title="`我的帖子 ${i}`" description="帖子摘要..." />
          </n-list-item>
        </n-list>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NAvatar, NCard, NH1, NH3, NH4, NP, NDivider, NList, NListItem, NThing, NSpace } from 'naive-ui'
</script>
