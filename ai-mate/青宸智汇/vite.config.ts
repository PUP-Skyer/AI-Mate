import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT) || 3000,
      cors: true,
      origin: `http://localhost:${env.VITE_PORT || 3000}`,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/ai': {
          target: 'http://localhost:9000',
          changeOrigin: true,
        },
      },
    },
  }
})
