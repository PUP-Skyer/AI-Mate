import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qiankun from 'vite-plugin-qiankun'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    qiankun('react-ai-chat', {
      useDevMode: true,
    }),
  ],
  optimizeDeps: {
    include: ['@ant-design/icons'],
  },
  build: {
    commonjsOptions: {
      include: [/@ant-design\/icons/],
    },
  },
  server: {
    port: 4001,
    host: '0.0.0.0',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    cors: true,
  },
})
