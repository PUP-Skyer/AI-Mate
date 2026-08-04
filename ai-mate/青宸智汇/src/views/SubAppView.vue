<template>
  <div class="subapp-view">
    <div id="subapp-container" class="subapp-container"></div>
    <div v-if="loading" class="loading-wrapper">
      <n-spin size="large" />
      <p>正在加载子应用 {{ microAppName }}...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NSpin } from 'naive-ui'

const route = useRoute()
const loading = ref(true)
const microAppName = ref('')

onMounted(() => {
  const meta = route.meta as { microApp?: string }
  microAppName.value = meta.microApp || ''

  // 子应用由 qiankun 自动加载到 #subapp-container
  // 这里设置一个延时来模拟加载完成检测
  setTimeout(() => {
    loading.value = false
  }, 2000)
})

watch(
  () => route.path,
  () => {
    loading.value = true
    const meta = route.meta as { microApp?: string }
    microAppName.value = meta.microApp || ''
    setTimeout(() => {
      loading.value = false
    }, 2000)
  }
)
</script>

<style scoped>
.subapp-view {
  width: 100%;
  height: 100%;
  position: relative;
}

.subapp-container {
  width: 100%;
  height: 100%;
}

.loading-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #999;
}
</style>
