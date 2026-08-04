<template>
  <div class="home-view">
    <n-h2>欢迎使用 青宸智汇 智能协作平台</n-h2>
    <n-p>
      请从左侧菜单选择功能模块，或从顶部导航进入 AI 数字员工工作区。
    </n-p>
    <n-grid :cols="4" :x-gap="16" :y-gap="16" style="margin-top: 24px">
      <n-gi>
        <n-card title="探路者" hoverable>
          <template #cover>
            <div class="card-icon-wrapper" style="background: #e8f5e9">
              <n-icon size="48" color="#18a058">
                <compass-outline />
              </n-icon>
            </div>
          </template>
          AI 智能对话助手，帮您探索和发现
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="军师" hoverable>
          <template #cover>
            <div class="card-icon-wrapper" style="background: #fff3e0">
              <n-icon size="48" color="#f08c00">
                <bulb-outline />
              </n-icon>
            </div>
          </template>
          智能方案生成，为您出谋划策
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="工匠" hoverable>
          <template #cover>
            <div class="card-icon-wrapper" style="background: #e3f2fd">
              <n-icon size="48" color="#2080f0">
                <hammer-outline />
              </n-icon>
            </div>
          </template>
          协作空间，与团队高效协作
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="管家" hoverable>
          <template #cover>
            <div class="card-icon-wrapper" style="background: #f3e5f5">
              <n-icon size="48" color="#8a2be2">
                <home-outline />
              </n-icon>
            </div>
          </template>
          数据看板，全局掌控一目了然
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import {
  CompassOutline,
  BulbOutline,
  HammerOutline,
  HomeOutline,
} from '@vicons/ionicons5'
import { NCard, NGrid, NGi, NIcon, NH2, NP } from 'naive-ui'
</script>

<style scoped>
.home-view {
  padding: 8px;
}

.card-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
}
</style>
