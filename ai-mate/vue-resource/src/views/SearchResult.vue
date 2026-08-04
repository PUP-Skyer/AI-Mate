<template>
  <div class="search-result">
    <n-h1>搜索结果</n-h1>
    <n-space vertical>
      <n-input v-model:value="keyword" placeholder="输入关键词搜索..." />
      <n-list bordered>
        <n-list-item v-for="i in 5" :key="i">
          <n-thing :title="`搜索结果 ${i}`" description="匹配的资源描述信息...">
            <template #action>
              <n-button text @click="$router.push(`/resources/${i}`)">查看详情</n-button>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput, NList, NListItem, NThing, NSpace, NH1 } from 'naive-ui'

const keyword = ref('')
</script>
