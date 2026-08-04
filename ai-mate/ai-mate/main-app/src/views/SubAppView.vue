<template>
  <div class="subapp-view">
    <div id="subapp-container" class="subapp-container">
      <div class="subapp-message">
        <n-icon size="48" color="#18a058">
          <information-circle-outline />
        </n-icon>
        <h3>子应用访问提示</h3>
        <p>当前子应用 {{ microAppName }} 未加载</p>
        <p>请单独启动子应用后再访问</p>
        <div v-if="microAppName === 'react-ai-chat'" class="subapp-url">
          <p>子应用地址: <a href="http://localhost:5174/" target="_blank">http://localhost:5174/</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'

const route = useRoute()
const microAppName = ref('')

onMounted(() => {
  const meta = route.meta as { microApp?: string }
  microAppName.value = meta.microApp || ''
})

watch(
  () => route.path,
  () => {
    const meta = route.meta as { microApp?: string }
    microAppName.value = meta.microApp || ''
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
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7f9;
}

.subapp-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  text-align: center;
}

.subapp-message h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.subapp-message p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.subapp-url {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  width: 100%;
}

.subapp-url a {
  color: #18a058;
  text-decoration: none;
}

.subapp-url a:hover {
  text-decoration: underline;
}
</style>
