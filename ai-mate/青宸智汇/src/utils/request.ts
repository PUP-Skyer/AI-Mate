import axios from 'axios'

// 使用相对路径 /api，由 Vite 代理转发到后端 8080
const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// 请求拦截器：注入 Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai-mate-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理错误
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      // 业务错误
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ai-mate-token')
      localStorage.removeItem('ai-mate-refresh-token')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

export default request
