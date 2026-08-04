<template>
  <n-layout class="app-layout">
    <AppHeader />
    <n-layout has-sider style="height: calc(100vh - 64px)">
      <AppSidebar />
      <n-layout-content class="main-content">
        <router-view />
      </n-layout-content>
    </n-layout>
    <AppFooter />
  </n-layout>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppFooter from './AppFooter.vue'
import { NLayout, NLayoutContent } from 'naive-ui'
</script>

<style scoped>
.app-layout {
  height: 100vh;
}
.main-content {
  padding: 16px;
  overflow: auto;
  background-color: #f5f7f9;
}
</style>