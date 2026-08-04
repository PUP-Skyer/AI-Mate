import request from '@/utils/request'

export function getUserProfile() {
  return request.get('/user/profile')
}

export function updateProfile(data: { nickname?: string; avatar?: string }) {
  return request.put('/user/profile', data)
}

export function updateStartupProfile(data: {
  stage?: string
  industry?: string
  productType?: string
  teamSize?: string
  preferences?: string
}) {
  return request.put('/user/startup-profile', data)
}
