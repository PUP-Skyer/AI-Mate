import request from '@/utils/request'

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  email: string
  password: string
  nickname?: string
}

export function login(data: LoginParams) {
  return request.post('/auth/login', data)
}

export function register(data: RegisterParams) {
  return request.post('/auth/register', data)
}

export function refreshToken(refreshToken: string) {
  return request.post('/auth/refresh', { refreshToken })
}
