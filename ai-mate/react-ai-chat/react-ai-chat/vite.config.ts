import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 代理配置 - 开发环境将 /api 请求转发到后端服务（server.js 监听 8080，路由自带 /api 前缀）
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    cors: true,
  },
  // qiankun 子应用配置
  base: '/',
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three';
            if (id.includes('echarts')) return 'echarts';
            return 'vendor';
          }
        },
      },
    },
  },
})
