import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qiankun from 'vite-plugin-qiankun'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    qiankun('react-collab', {
      useDevMode: true,
    }),
  ],
  server: {
    port: 4003,
    host: '0.0.0.0',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    cors: true,
  },
})
