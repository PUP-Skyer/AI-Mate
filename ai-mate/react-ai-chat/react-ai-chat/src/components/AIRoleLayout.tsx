/**
 * 通用 AI 角色页面布局
 * 顶部标签切换子面板 + 下方内容区
 * 支持角色主题色动态注入 + 内容区进入动画
 */

import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Typography, Avatar } from 'antd';
import type { AIRole } from '../store/aiStore';

const { Content } = Layout;
const { Title, Text } = Typography;

export interface PanelItem {
  key: string;
  label: string;
  children: React.ReactNode;
  fullHeight?: boolean;
}

interface AIRoleLayoutProps {
  role: AIRole;
  title: string;
  icon: React.ReactNode;
  description: string;
  panels: PanelItem[];
  themeColor?: string;
  themeSecondary?: string;
  hideHeader?: boolean;
}

const ROLE_THEME_COLORS: Record<AIRole, { primary: string; secondary: string }> = {
  scout: { primary: '#1677ff', secondary: '#36cfc9' },
  sage: { primary: '#faad14', secondary: '#ffc53d' },
  maker: { primary: '#52c41a', secondary: '#95de64' },
  butler: { primary: '#eb2f96', secondary: '#ff85c0' },
};

const AIRoleLayout: React.FC<AIRoleLayoutProps> = ({
  title,
  icon,
  description,
  panels,
  role,
  themeColor,
  themeSecondary,
  hideHeader = false,
}) => {
  const [activeKey, setActiveKey] = useState(panels[0]?.key);
  const [animationKey, setAnimationKey] = useState(0);

  // 使用传入的颜色或根据角色获取默认颜色
  const colors = ROLE_THEME_COLORS[role];
  const primary = themeColor || colors.primary;
  const secondary = themeSecondary || colors.secondary;

  // Tab 切换时触发动画
  const handleTabChange = (key: string) => {
    setActiveKey(key);
    setAnimationKey((prev) => prev + 1);
  };

  // 动态注入角色色 CSS 变量
  useEffect(() => {
    document.documentElement.style.setProperty('--role-primary', primary);
    document.documentElement.style.setProperty('--role-secondary', secondary);
  }, [primary, secondary]);

  return (
    <Layout style={{ height: '100%', background: '#f5f5f5' }}>
      {/* 注入 Tabs 高度占满样式 + 角色色覆盖 */}
      <style>{`
        .ai-role-tabs .ant-tabs-content-holder {
          flex: 1 !important;
          min-height: 0 !important;
        }
        .ai-role-tabs .ant-tabs-content {
          height: 100% !important;
        }
        .ai-role-tabs .ant-tabs-tabpane {
          height: 100% !important;
        }
        .ai-role-tabs .ant-tabs-tab-active {
          position: relative;
        }
        .ai-role-tabs .ant-tabs-tab-active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 8px;
          right: 8px;
          height: 3px;
          background: linear-gradient(90deg, ${primary}, ${secondary});
          border-radius: 2px 2px 0 0;
          animation: indicatorSlide 0.2s ease-out;
        }
        .ai-role-tabs .ant-tabs-tab.ant-tabs-tab-active {
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, ${primary}08 100%) !important;
        }
        @keyframes indicatorSlide {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .panel-animate {
          animation: slideUpFade 0.3s ease-out;
        }
      `}</style>
      <Content style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* 顶部角色信息栏 */}
        {!hideHeader && (
        <div
          style={{
            padding: '12px 20px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <Avatar
            size={36}
            icon={icon}
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              flexShrink: 0,
              boxShadow: `0 2px 8px ${primary}33`,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={5} style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              {title}
              {/* 标题装饰线 */}
              <span
                style={{
                  display: 'inline-block',
                  width: 24,
                  height: 2,
                  background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                  borderRadius: 1,
                  verticalAlign: 'middle',
                }}
              />
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {description}
            </Text>
          </div>
        </div>
        )}

        {/* 标签面板 */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Tabs
            activeKey={activeKey}
            onChange={handleTabChange}
            type="card"
            className="ai-role-tabs"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            items={panels.map((p) => ({
              key: p.key,
              label: p.label,
              children: (
                <div
                  key={animationKey + p.key}
                  className="panel-animate"
                  style={{
                    height: '100%',
                    background: '#fff',
                    borderRadius: '0 0 8px 8px',
                    overflowY: p.fullHeight ? 'hidden' : 'auto',
                    overflowX: 'hidden',
                    padding: p.fullHeight ? undefined : 20,
                    minHeight: p.fullHeight ? undefined : 400,
                  }}
                >
                  {p.children}
                </div>
              ),
            }))}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default AIRoleLayout;
