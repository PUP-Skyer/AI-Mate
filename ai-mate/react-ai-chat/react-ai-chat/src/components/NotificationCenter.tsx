/**
 * 消息中心面板（Drawer）
 * 仿 MemoryPanel 形态：系统通知列表 + 未读标记 + 已读/清空
 */

import React, { useEffect } from 'react';
import {
  Drawer,
  List,
  Badge,
  Button,
  Space,
  Typography,
  Empty,
  Popconfirm,
  Spin,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ClearOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { useNotificationStore } from '../store/notificationStore';
import { useI18n } from '../i18n';

const { Text } = Typography;

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    drawerOpen,
    fetchAll,
    markOne,
    markAll,
    clearAll,
    close,
  } = useNotificationStore();
  const { t } = useI18n();

  // 打开时拉取
  useEffect(() => {
    if (drawerOpen) fetchAll();
  }, [drawerOpen, fetchAll]);

  // 相对时间
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return t('messages.justNow');
    if (diff < 3_600_000) return t('messages.minutesAgo', { count: Math.floor(diff / 60_000) });
    if (diff < 86_400_000) return t('messages.hoursAgo', { count: Math.floor(diff / 3_600_000) });
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <Drawer
      title={
        <Space>
          <BellOutlined style={{ color: '#faad14' }} />
          <span>{t('messages.title')}</span>
          {unreadCount > 0 && (
            <Badge count={unreadCount} color="#faad14" style={{ marginLeft: 4 }} />
          )}
        </Space>
      }
      open={drawerOpen}
      onClose={close}
      width={440}
    >
      {/* 头部操作 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('messages.summary', { total: notifications.length, unread: unreadCount })}
        </Text>
        <Space>
          <Button
            size="small"
            icon={<CheckOutlined />}
            disabled={unreadCount === 0}
            onClick={markAll}
          >
            {t('messages.markAll')}
          </Button>
          <Popconfirm title={t('messages.clearConfirm')} onConfirm={clearAll}>
            <Button size="small" icon={<ClearOutlined />} danger disabled={notifications.length === 0}>
              {t('messages.clear')}
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 通知列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          description={t('messages.empty')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: 40 }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{
                cursor: 'pointer',
                background: item.isRead ? 'transparent' : '#fffbe6',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 4,
                border: item.isRead ? '1px solid transparent' : '1px solid #ffe58f',
                transition: 'background 0.2s',
              }}
              onClick={() => {
                if (!item.isRead) markOne(item.id);
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  {!item.isRead && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#faad14',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Text strong style={{ fontSize: 13 }}>
                    {item.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto', flexShrink: 0 }}>
                    {formatTime(item.createdAt)}
                  </Text>
                </div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.content}
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          <NotificationOutlined style={{ marginRight: 4 }} />
          {t('messages.hint')}
        </Text>
      </div>
    </Drawer>
  );
};

export default NotificationCenter;
