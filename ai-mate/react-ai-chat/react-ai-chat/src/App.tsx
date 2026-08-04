/**
 * 青宸智汇 Chat - 主应用组件
 * 左侧边栏导航：功能区 + AI 角色区
 */

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Tooltip, Space, Button, Spin } from 'antd';
import {
  PlusOutlined,
  BookOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  BulbOutlined,
  ToolOutlined,
  CustomerServiceOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAIStore } from './store/aiStore';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import { useI18n } from './i18n';
import LoginPage from './pages/LoginPage';
import NotificationCenter from './components/NotificationCenter';
import type { AppPage, AIRole } from './types';
import ScoutAI from './pages/ScoutAI';
import SageAI from './pages/SageAI';
import MakerAI from './pages/MakerAI';
import ButlerAI from './pages/ButlerAI';
import NewConversation from './pages/NewConversation';
import SkillLibrary from './pages/SkillLibrary';
import MCPConfig from './pages/MCPConfig';
import Automation from './pages/Automation';
import KnowledgeVault from './pages/KnowledgeVault';
import AppCenter from './pages/AppCenter';
import UsageStats from './pages/UsageStats';
import IndustryReport from './pages/IndustryReport';
import AIPolicyPage from './pages/AIPolicy';
import IndustryDataPage from './pages/IndustryData';
import MemoryPanel from './components/MemoryPanel';
import UserProfileMenu from './components/UserProfileMenu';
import SettingsDrawer from './components/SettingsDrawer';

const { Sider, Content } = Layout;
const { Text } = Typography;

// 快捷功能区配置（文案走 i18n）
const makeToolMenuItems = (t: (k: string) => string) => [
  {
    key: 'new-conversation',
    label: t('menu.newConversation'),
    icon: <PlusOutlined />,
    description: t('menu.newConversationDesc'),
  },
  {
    key: 'skill-library',
    label: t('menu.skillLibrary'),
    icon: <BookOutlined />,
    description: t('menu.skillLibraryDesc'),
  },
  {
    key: 'mcp-config',
    label: t('menu.mcp'),
    icon: <ApiOutlined />,
    description: t('menu.mcpDesc'),
  },
  {
    key: 'automation',
    label: t('menu.automation'),
    icon: <ThunderboltOutlined />,
    description: t('menu.automationDesc'),
  },
  {
    key: 'knowledge-vault',
    label: t('menu.knowledgeVault'),
    icon: <DatabaseOutlined />,
    description: t('menu.knowledgeVaultDesc'),
  },
  {
    key: 'app-center',
    label: t('menu.appCenter'),
    icon: <AppstoreOutlined />,
    description: t('menu.appCenterDesc'),
  },
  {
    key: 'usage-stats',
    label: t('menu.usageStats'),
    icon: <BarChartOutlined />,
    description: t('menu.usageStatsDesc'),
  },
  {
    key: 'message-center',
    label: t('menu.messageCenter'),
    icon: <BellOutlined />,
    description: t('menu.messageCenterDesc'),
  },
];

// AI 角色区配置（名称走 i18n）
const makeAiRoleItems = (t: (k: string) => string): Array<{ key: string; label: string; icon: React.ReactNode; color: string; secondary: string; role: AIRole }> => [
  { key: 'ai-scout', label: t('roles.scout'), icon: <SearchOutlined />, color: '#1677ff', secondary: '#36cfc9', role: 'scout' },
  { key: 'ai-sage', label: t('roles.sage'), icon: <BulbOutlined />, color: '#faad14', secondary: '#ffc53d', role: 'sage' },
  { key: 'ai-maker', label: t('roles.maker'), icon: <ToolOutlined />, color: '#52c41a', secondary: '#95de64', role: 'maker' },
  { key: 'ai-butler', label: t('roles.butler'), icon: <CustomerServiceOutlined />, color: '#eb2f96', secondary: '#ff85c0', role: 'butler' },
];

const pageComponents: Record<AppPage, React.FC> = {
  'ai-scout': ScoutAI,
  'ai-sage': SageAI,
  'ai-maker': MakerAI,
  'ai-butler': ButlerAI,
  'new-conversation': NewConversation,
  'skill-library': SkillLibrary,
  'mcp-config': MCPConfig,
  'automation': Automation,
  'knowledge-vault': KnowledgeVault,
  'app-center': AppCenter,
  'usage-stats': UsageStats,
  'industry-report': IndustryReport,
  'ai-policy': AIPolicyPage,
  'industry-data': IndustryDataPage,
};

const App: React.FC = () => {
  const { currentPage, setCurrentPage, currentRole } = useAIStore();
  const { isAuthenticated, authLoading, restoreSession } = useAuthStore();
  const notificationOpen = useNotificationStore((s) => s.open);
  const { t } = useI18n();
  const [memoryOpen, setMemoryOpen] = useState(false);

  const toolMenuItems = makeToolMenuItems(t);
  const aiRoleItems = makeAiRoleItems(t);

  // 启动时恢复登录会话
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 会话校验中：全局加载态
  if (authLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 根级守卫：未登录渲染登录页
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleMenuClick = (key: string) => {
    // 消息中心走 Drawer 面板，不切换页面
    if (key === 'message-center') {
      notificationOpen();
      return;
    }
    setCurrentPage(key as AppPage);
  };

  const PageComponent = pageComponents[currentPage];

  // 获取当前角色的主题色
  const currentRoleColor = aiRoleItems.find((item) => item.role === currentRole)?.color || '#1677ff';

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 左侧边栏 */}
      <Sider
        width={200}
        breakpoint={undefined}
        collapsible={false}
        style={{
          background: '#141414',
          borderRight: '1px solid #2a2a2a',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: '20px 16px 12px',
              borderBottom: '1px solid #2a2a2a',
              flexShrink: 0,
            }}
          >
            <Space align="center" size={8}>
              <div
                className="logo-breathe"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #1677ff, #36cfc9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text strong style={{ color: '#fff', fontSize: 14 }}>A</Text>
              </div>
              <Text strong style={{ color: '#fff', fontSize: 16, letterSpacing: 1 }}>
                {t('app.name')}
              </Text>
            </Space>
          </div>

          {/* 快捷功能区 + AI 角色 */}
          <div style={{ padding: '12px 8px', flex: 1, overflow: 'auto', minHeight: 0 }}>
            <Text
              type="secondary"
              style={{
                fontSize: 10,
                padding: '0 8px',
                marginBottom: 8,
                display: 'block',
                color: '#8c8c8c',
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {t('app.group.toolbox')}
            </Text>
            <Menu
              mode="inline"
              selectedKeys={toolMenuItems.some((i) => i.key === currentPage) ? [currentPage] : []}
              onClick={({ key }) => handleMenuClick(key)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#d9d9d9',
              }}
              items={toolMenuItems.map((item) => ({
                key: item.key,
                icon: (
                  <span style={{ color: '#8c8c8c' }}>{item.icon}</span>
                ),
                label: (
                  <Tooltip title={item.description} placement="right">
                    <span style={{ color: '#d9d9d9' }}>{item.label}</span>
                  </Tooltip>
                ),
              }))}
              theme="dark"
            />

            {/* 分隔线 */}
            <div style={{ margin: '16px 8px', borderTop: '1px solid #2a2a2a' }} />

            <Text
              type="secondary"
              style={{
                fontSize: 10,
                padding: '0 8px',
                marginBottom: 8,
                display: 'block',
                color: '#8c8c8c',
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {t('app.group.roles')}
            </Text>
            <Menu
              mode="inline"
              selectedKeys={[currentPage]}
              onClick={({ key }) => handleMenuClick(key)}
              style={{
                background: 'transparent',
                border: 'none',
              }}
              items={aiRoleItems.map((item) => ({
                key: item.key,
                icon: (
                  <span style={{ color: item.color }}>{item.icon}</span>
                ),
                label: (
                  <span style={{ color: '#d9d9d9' }}>{item.label}</span>
                ),
                style: {
                  position: 'relative',
                  marginBottom: 2,
                  borderRadius: 6,
                },
              }))}
              theme="dark"
            />
          </div>

          {/* 底部：个人中心 + 记忆入口 + 版本号 */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #2a2a2a',
              flexShrink: 0,
            }}
          >
            <Button
              block
              size="small"
              icon={<BulbOutlined />}
              onClick={() => setMemoryOpen(true)}
              style={{
                marginBottom: 8,
                background: 'transparent',
                color: '#d9d9d9',
                borderColor: '#2a2a2a',
              }}
            >
              {t('menu.memory')}
            </Button>
            <UserProfileMenu />
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 11, color: '#595959' }}>
                {t('app.version')}
              </Text>
            </div>
          </div>
        </div>
      </Sider>

      {/* 设置抽屉 */}
      <SettingsDrawer />

      {/* 记忆管理面板 */}
      <MemoryPanel open={memoryOpen} onClose={() => setMemoryOpen(false)} />

      {/* 消息中心面板 */}
      <NotificationCenter />

      {/* 主内容区 */}
      <Content
        key={currentPage}
        className="page-fade-in"
        style={{ background: '#f5f5f5', overflow: 'auto' }}
      >
        <PageComponent />
      </Content>
    </Layout>
  );
};

export default App;
