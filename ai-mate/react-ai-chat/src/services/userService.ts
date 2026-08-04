const API_BASE = '/api';

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `请求失败: ${res.status}` }));
    throw new Error(err.message || `请求失败: ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

// 用户资料
export const fetchUserProfile = () => request('GET', '/user/profile');
export const updateUserProfile = (data: { username?: string; avatar?: string }) =>
  request('PUT', '/user/profile', data);

// 签到
export const fetchSignInRecords = () => request<{ records: Array<{ date: string; signed: boolean }>; consecutiveDays: number }>('GET', '/user/sign-in');
export const signIn = () => request('POST', '/user/sign-in');

// 桌宠
export const fetchDeskPets = () => request<Array<{
  id: number;
  pet_id: string;
  name: string;
  rarity: string;
  image: string;
  description: string;
  obtained_at: string;
}>>('GET', '/user/desk-pets');

export const addDeskPet = (pet: {
  pet_id: string;
  name: string;
  rarity: string;
  image: string;
  description: string;
}) => request('POST', '/user/desk-pets', pet);

// 设置
export const fetchSettings = () => request<{
  dark_mode: boolean;
  notifications: boolean;
  auto_save: boolean;
  sound_effects: boolean;
}>('GET', '/user/settings');

export const updateSettings = (settings: {
  dark_mode: boolean;
  notifications: boolean;
  auto_save: boolean;
  sound_effects: boolean;
}) => request('PUT', '/user/settings', settings);
