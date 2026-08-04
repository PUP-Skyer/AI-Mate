import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 代理配置 - 开发环境将 /api 请求转发到 Serverless 代理层
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    cors: true,
  },
  // qiankun 子应用配置
  base: '/',
  build: {
    target: 'esnext',
    lib: {
      entry: './src/main.tsx',
      name: 'AiMateChat',
      formats: ['umd'],
      fileName: () => 'main.js',
    },
  },
})
