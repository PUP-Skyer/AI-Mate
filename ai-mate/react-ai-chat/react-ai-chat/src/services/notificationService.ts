/**
 * 消息通知服务
 * 对接后端 /api/notifications（需登录 token）
 */

import { authFetch } from './http';

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: number;
}

export interface NotificationList {
  list: NotificationItem[];
  unreadCount: number;
}

/** 获取通知列表 */
export async function fetchNotifications(limit = 50): Promise<NotificationList> {
  try {
    const resp = await authFetch(`/notifications?limit=${limit}`);
    const json = await resp.json();
    return json?.data || { list: [], unreadCount: 0 };
  } catch {
    return { list: [], unreadCount: 0 };
  }
}

/** 标记单条已读 */
export async function markNotificationRead(id: number): Promise<boolean> {
  try {
    const resp = await authFetch(`/notifications/${id}/read`, { method: 'POST' });
    return resp.ok;
  } catch {
    return false;
  }
}

/** 全部已读 */
export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const resp = await authFetch('/notifications/read-all', { method: 'POST' });
    return resp.ok;
  } catch {
    return false;
  }
}

/** 清空通知 */
export async function clearAllNotifications(): Promise<boolean> {
  try {
    const resp = await authFetch('/notifications', { method: 'DELETE' });
    return resp.ok;
  } catch {
    return false;
  }
}
