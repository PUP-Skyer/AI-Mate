/**
 * 个人中心下拉菜单
 * 左侧边栏底部常驻组件
 */

import React from 'react';
import {
  Dropdown,
  Avatar,
  Typography,
  Space,
} from 'antd';
import {
  ThunderboltOutlined,
  UserOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAIStore } from '../store/aiStore';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n';
import type { ThemeType } from '../types';

const { Text } = Typography;

const UserProfileMenu: React.FC = () => {
  const {
    userInfo,
    settings,
    toggleSettingsDrawer,
    updateSettings,
  } = useAIStore();
  const { userInfo: authUser, logout } = useAuthStore();
  const { t } = useI18n();

  const isDark = settings.theme === 'dark';

  // 展示用户：优先登录用户
  const displayUser = {
    nickname: authUser?.nickname || authUser?.username || userInfo.nickname,
    quickPassCount: authUser?.quickPassCount ?? userInfo.quickPassCount,
    tierLabel: authUser?.tierLabel || userInfo.tierLabel,
  };

  const handleThemeToggle = () => {
    const next: ThemeType = isDark ? 'light' : 'dark';
    updateSettings({ theme: next });
  };

  const menuItems = [
    {
      key: 'upgrade',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined />
          <span>{t('profile.upgrade')}</span>
        </div>
      ),
      style: {
        background: '#2a2a2a',
        color: '#fff',
        borderRadius: 6,
        margin: '4px 8px',
      },
    },
    { key: 'divider-1', type: 'divider' as const },
    {
      key: 'account',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <UserOutlined />
            <span>{t('profile.manageAccount')}</span>
          </Space>
          <RightOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
        </div>
      ),
      onClick: () => toggleSettingsDrawer(true),
    },
    { key: 'divider-2', type: 'divider' as const },
    {
      key: 'language',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <GlobalOutlined />
            <span>{t('profile.language')}</span>
          </Space>
          <Space size={4}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
              {settings.language === 'zh-CN' ? t('settings.langZh') : t('settings.langEn')}
            </Text>
            <RightOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
          </Space>
        </div>
      ),
    },
    {
      key: 'theme',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            {isDark ? <MoonOutlined /> : <SunOutlined />}
            <span>{t('profile.theme')}</span>
          </Space>
          <Space size={4}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
              {isDark ? t('settings.themeDark') : t('settings.themeLight')}
            </Text>
            <RightOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
          </Space>
        </div>
      ),
      onClick: handleThemeToggle,
    },
    {
      key: 'settings',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <SettingOutlined />
            <span>{t('profile.settings')}</span>
          </Space>
          <RightOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
        </div>
      ),
      onClick: () => toggleSettingsDrawer(true),
    },
    {
      key: 'feedback',
      label: (
        <Space>
          <ExclamationCircleOutlined />
          <span>{t('profile.feedback')}</span>
        </Space>
      ),
    },
    { key: 'divider-3', type: 'divider' as const },
    {
      key: 'logout',
      label: (
        <div style={{ textAlign: 'center', color: '#ff4d4f' }}>
          {t('profile.logout')}
        </div>
      ),
      onClick: logout,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomLeft"
      getPopupContainer={(trigger) => trigger.parentElement || document.body}
      overlayStyle={{ minWidth: 220 }}
      dropdownRender={(menu) => (
        <div
          style={{
            background: '#1f1f1f',
            border: '1px solid #2a2a2a',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            padding: '4px 0',
          }}
        >
          {menu}
        </div>
      )}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = '#1f1f1f';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      >
        <Avatar
          size={32}
          style={{ background: '#fadb14', color: '#262626', fontWeight: 600 }}
        >
          {displayUser.nickname.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Text
            style={{
              color: '#d9d9d9',
              fontSize: 13,
              display: 'block',
              lineHeight: 1.4,
            }}
            ellipsis
          >
            {displayUser.nickname}
          </Text>
          <Space size={8}>
            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
              <ThunderboltOutlined style={{ marginRight: 4 }} />
              {displayUser.quickPassCount}
            </Text>
            <span
              style={{
                fontSize: 11,
                color: '#8c8c8c',
                background: '#2a2a2a',
                padding: '0 6px',
                borderRadius: 4,
              }}
            >
              {displayUser.tierLabel}
            </span>
          </Space>
        </div>
      </div>
    </Dropdown>
  );
};

export default UserProfileMenu;
