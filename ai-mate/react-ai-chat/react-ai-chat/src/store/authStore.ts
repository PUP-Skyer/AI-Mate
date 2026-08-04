/**
 * 认证状态管理（登录/注册/会话恢复/退出）
 */
import { create } from 'zustand';
import { login, register, fetchMe, changePassword, type AuthUser } from '../services/authService';
import { clearAuthStorage, getToken } from '../services/http';
import { useAIStore } from './aiStore';

const USER_KEY = 'ai_mate_user';

// 默认用户（未登录兜底）
const DEFAULT_USER: AuthUser = {
  id: 0,
  email: '',
  username: '未登录',
  nickname: '未登录',
  tier: 'free',
  tierLabel: '免费',
  quickPassCount: 0,
};

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

interface AuthStore {
  token: string | null;
  userInfo: AuthUser;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => {
  const syncUserToAIStore = (user: AuthUser) => {
    useAIStore.getState().setUserInfo({
      id: String(user.id),
      nickname: user.nickname || user.username || '未登录',
      avatar: user.avatar || undefined,
      tier: (user.tier as 'free' | 'pro') || 'free',
      tierLabel: user.tierLabel || '免费',
      quickPassCount: user.quickPassCount,
    });
  };

  const storeLogin = (token: string, user: AuthUser) => {
    localStorage.setItem('ai_mate_token', token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, userInfo: user, isAuthenticated: true, authLoading: false });
    syncUserToAIStore(user);
  };

  return {
    token: getToken(),
    userInfo: loadStoredUser() || DEFAULT_USER,
    isAuthenticated: !!getToken() && !!loadStoredUser(),
    authLoading: !!getToken(), // 有 token 时需要启动时校验

    login: async (email, password) => {
      const data = await login(email, password);
      storeLogin(data.token, data.user);
    },

    register: async (email, password, username) => {
      const data = await register(email, password, username);
      storeLogin(data.token, data.user);
    },

    logout: () => {
      clearAuthStorage();
      set({ token: null, userInfo: DEFAULT_USER, isAuthenticated: false, authLoading: false });
      // 同步清理 AI store 用户信息
      useAIStore.getState().setUserInfo({
        id: 'user-88062778542',
        nickname: '用户88062778542',
        tier: 'free',
        tierLabel: '免费',
        quickPassCount: 0,
      });
    },

    restoreSession: async () => {
      const token = getToken();
      if (!token) {
        set({ authLoading: false });
        return;
      }
      try {
        const user = await fetchMe(token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({ token, userInfo: user, isAuthenticated: true, authLoading: false });
        syncUserToAIStore(user);
      } catch {
        clearAuthStorage();
        set({ token: null, userInfo: DEFAULT_USER, isAuthenticated: false, authLoading: false });
      }
    },

    changePassword: async (oldPassword, newPassword) => {
      const token = get().token;
      if (!token) throw new Error('未登录');
      await changePassword(oldPassword, newPassword, token);
    },
  };
});
