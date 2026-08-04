/**
 * 消息中心状态管理
 */
import { create } from 'zustand';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  type NotificationItem,
} from '../services/notificationService';

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  drawerOpen: boolean;
  fetchAll: () => Promise<void>;
  markOne: (id: number) => Promise<void>;
  markAll: () => Promise<void>;
  clearAll: () => Promise<void>;
  open: () => void;
  close: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  drawerOpen: false,

  fetchAll: async () => {
    set({ loading: true });
    const data = await fetchNotifications(50);
    set({ notifications: data.list, unreadCount: data.unreadCount, loading: false });
  },

  markOne: async (id) => {
    const ok = await markNotificationRead(id);
    if (ok) {
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    }
  },

  markAll: async () => {
    const ok = await markAllNotificationsRead();
    if (ok) {
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    }
  },

  clearAll: async () => {
    const ok = await clearAllNotifications();
    if (ok) {
      set({ notifications: [], unreadCount: 0 });
    }
  },

  open: () => set({ drawerOpen: true }),
  close: () => set({ drawerOpen: false }),
}));
