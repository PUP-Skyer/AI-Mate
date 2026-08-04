/**
 * 青宸智汇 Chat - 主应用组件
 * 多角色切换 + 可展开AI子功能菜单
 * 设计系统：Cyberpunk Glassmorphism + Lucide Icons
 */

import React, { useState, useEffect } from 'react';
import { Avatar, Badge, ConfigProvider, theme } from 'antd';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ui';
import {
  User,
  Wrench,
  GraduationCap,
  Award,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Compass,
  Brain,
  Shield,
  BookOpen,
  MessageSquare,
  ChevronDown,
  LogOut,
  Wallet,
  FolderKanban,
  Presentation,
} from 'lucide-react';
import ScoutAI from './pages/ScoutAI';
import SageAI from './pages/SageAI';
import MakerAI from './pages/MakerAI';
import ButlerAI from './pages/ButlerAI';
import ResourcePlatform from './pages/ResourcePlatform';
import Community from './pages/Community';
import DataDashboard from './pages/DataDashboard';
import ProfilePage from './pages/ProfilePage';
import ExpertPage from './pages/expert/ExpertPage';
import AdminPage from './pages/admin/AdminPage';
import FinancePage from './pages/finance/FinancePage';
import ProjectShowcase from './pages/ProjectShowcase';
import ProjectManagement from './pages/ProjectManagement';
import LoginPage from './pages/LoginPage';

type UserRole = 'student' | 'investor' | 'expert' | 'admin';
type PageKey = string;

interface SubMenuItem {
  key: string;
  label: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  children?: SubMenuItem[];
}

const roleConfig: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  student: { label: '学生端', color: '#3B82F6', icon: React.createElement(GraduationCap, { size: 20 }) },
  investor: { label: '投资端', color: '#10B981', icon: React.createElement(Wallet, { size: 20 }) },
  expert: { label: '专家端', color: '#8B5CF6', icon: React.createElement(Award, { size: 20 }) },
  admin: { label: '管理端', color: '#F59E0B', icon: React.createElement(Settings, { size: 20 }) },
};

// ---- AI 子功能定义 ----
const scoutSubs: SubMenuItem[] = [
  { key: 'supplier', label: '供应商搜索' },
  { key: 'partner', label: '合作伙伴推荐' },
  { key: 'market', label: '市场行情分析' },
  { key: 'industry', label: '行业报告查询' },
  { key: 'compare', label: '资源对比分析' },
];

const sageSubs: SubMenuItem[] = [
  { key: 'planning', label: '创业规划' },
];

const makerSubs: SubMenuItem[] = [
  { key: 'skills', label: '创业技能库' },
  { key: 'bp', label: 'BP生成' },
  { key: 'ppt', label: 'PPT大纲' },
  { key: 'docs', label: '产品文档' },
  { key: 'demo', label: '原型Demo展示' },
];

const butlerSubs: SubMenuItem[] = [
  { key: 'project-management', label: '项目管理' },
  { key: 'faq', label: '常见问题' },
  { key: 'feedback', label: '问题反馈' },
  { key: 'aftercare', label: '售后咨询' },
];

const studentMenus: MenuItem[] = [
  { key: 'scout', label: '探路者AI', icon: React.createElement(Compass, { size: 18 }), color: '#3B82F6', children: scoutSubs },
  { key: 'sage', label: '军师AI', icon: React.createElement(Brain, { size: 18 }), color: '#F59E0B', children: sageSubs },
  { key: 'maker', label: '工匠AI', icon: React.createElement(Wrench, { size: 18 }), color: '#10B981', children: makerSubs },
  { key: 'butler', label: '管家AI', icon: React.createElement(Shield, { size: 18 }), color: '#8B5CF6', children: butlerSubs },
  { key: 'resource', label: '平台资源', icon: React.createElement(BookOpen, { size: 18 }), color: '#06B6D4' },
  { key: 'community', label: '社区', icon: React.createElement(MessageSquare, { size: 18 }), color: '#EC4899' },
  { key: 'project-showcase', label: '项目展示', icon: React.createElement(Presentation, { size: 18 }), color: '#F43F5E' },
];

const expertMenus: MenuItem[] = [
  { key: 'expert', label: '专家评审', icon: React.createElement(Award, { size: 18 }), color: '#8B5CF6' },
  { key: 'resource', label: '平台资源', icon: React.createElement(BookOpen, { size: 18 }), color: '#06B6D4' },
  { key: 'community', label: '社区', icon: React.createElement(MessageSquare, { size: 18 }), color: '#EC4899' },
  { key: 'project-showcase', label: '项目展示', icon: React.createElement(Presentation, { size: 18 }), color: '#F43F5E' },
];

const investorMenus: MenuItem[] = [
  { key: 'finance', label: '融资对接', icon: React.createElement(Wallet, { size: 18 }), color: '#10B981' },
  { key: 'resource', label: '平台资源', icon: React.createElement(BookOpen, { size: 18 }), color: '#06B6D4' },
  { key: 'community', label: '社区', icon: React.createElement(MessageSquare, { size: 18 }), color: '#EC4899' },
  { key: 'project-showcase', label: '项目展示', icon: React.createElement(Presentation, { size: 18 }), color: '#F43F5E' },
];

const adminMenus: MenuItem[] = [
  { key: 'admin', label: '管理后台', icon: React.createElement(Settings, { size: 18 }), color: '#F59E0B' },
  { key: 'project-management', label: '项目管理', icon: React.createElement(FolderKanban, { size: 18 }), color: '#3B82F6' },
  { key: 'resource', label: '平台资源', icon: React.createElement(BookOpen, { size: 18 }), color: '#06B6D4' },
  { key: 'community', label: '社区', icon: React.createElement(MessageSquare, { size: 18 }), color: '#EC4899' },
];

const roleMenus: Record<UserRole, MenuItem[]> = {
  student: studentMenus,
  investor: investorMenus,
  expert: expertMenus,
  admin: adminMenus,
};

const defaultPages: Record<UserRole, string> = {
  student: 'scout',
  investor: 'finance',
  expert: 'expert',
  admin: 'admin',
};

const AppContent: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('ai-mate-role') as UserRole | null;
    if (savedRole && roleConfig[savedRole]) return savedRole;
    return 'student';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('ai-mate-token');
  });
  const [currentPage, setCurrentPage] = useState<PageKey>(() => {
    const savedRole = localStorage.getItem('ai-mate-role') as UserRole | null;
    if (savedRole && defaultPages[savedRole]) return defaultPages[savedRole];
    return 'scout';
  });
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<Set<string>>(new Set());
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const handlePageClick = (key: string) => {
    setCurrentPage(key);
    setActiveFeature(null);
    if (key.startsWith('ai-')) {
      setExpandedMenu(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedMenu((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    setCurrentPage(defaultPages[role]);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('ai-mate-token');
    localStorage.removeItem('ai-mate-role');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const currentMenus = roleMenus[userRole];
  const currentRole = roleConfig[userRole];
  const siderWidth = collapsed ? 72 : 260;

  const renderPage = () => {
    const sharedProps = { activeFeature, onFeatureChange: setActiveFeature };
    switch (currentPage) {
      case 'scout': return <ScoutAI {...sharedProps} />;
      case 'sage': return <SageAI {...sharedProps} />;
      case 'maker': return <MakerAI {...sharedProps} />;
      case 'butler': return <ButlerAI {...sharedProps} />;
      case 'resource': return <ResourcePlatform />;
      case 'community': return <Community />;
      case 'dashboard': return <DataDashboard />;
      case 'profile': return <ProfilePage />;
      case 'finance': return <FinancePage />;
      case 'expert': return <ExpertPage />;
      case 'admin': return <AdminPage />;
      case 'project-showcase': return <ProjectShowcase userRole={userRole} />;
      case 'project-management': return <ProjectManagement />;
      default: return <ScoutAI {...sharedProps} />;
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', background: 'var(--bg-page)',
      overflow: 'hidden', fontFamily: 'var(--font-body)',
      transition: 'background var(--transition-slow)',
    }}>
      {/* 浮动侧边栏 */}
      <aside style={{
        position: 'fixed', top: 16, left: 16, bottom: 16,
        width: siderWidth, display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--gradient-sidebar)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-lg)', zIndex: 100,
        transition: 'width var(--transition-slow)', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '16px 0' : '20px 16px',
          textAlign: collapsed ? 'center' : 'left',
          borderBottom: '1px solid var(--border-light)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(135deg, ${currentRole.color}, ${currentRole.color}dd)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${currentRole.color}40`, flexShrink: 0,
            }}>
              {React.cloneElement(currentRole.icon as React.ReactElement, { color: '#fff', size: 20 })}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  青宸智汇
                </h2>
                <div style={{ fontSize: 10, color: currentRole.color, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {currentRole.label}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 菜单（支持子级展开） */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {currentMenus.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenu.has(item.key);
            const isActive = currentPage === item.key;
            return (
              <div key={item.key}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpand(item.key);
                    } else {
                      handlePageClick(item.key);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: collapsed ? '10px 0' : '10px 14px',
                    border: 'none',
                    background: isActive ? `${item.color}18` : 'transparent',
                    color: isActive ? item.color : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10,
                    transition: 'all var(--transition-fast)',
                    borderRadius: 'var(--radius-md)',
                    margin: '2px 8px',
                    width: collapsed ? 56 : 'calc(100% - 16px)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{ color: isActive ? item.color : 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                      {hasChildren && (
                        <span style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform var(--transition-fast)',
                          color: 'var(--text-muted)',
                        }}>
                          {React.createElement(ChevronDown, { size: 14 })}
                        </span>
                      )}
                    </>
                  )}
                </button>
                {/* 子菜单 */}
                {hasChildren && isExpanded && !collapsed && (
                  <div style={{ paddingLeft: 40, paddingRight: 8 }}>
                    {item.children!.map((sub) => (
                      <button
                        key={sub.key}
                        onClick={() => {
                          handlePageClick(item.key);
                          setActiveFeature(sub.key);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: activeFeature === sub.key ? `${item.color}12` : 'transparent',
                          color: activeFeature === sub.key ? item.color : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          borderRadius: 'var(--radius-sm)',
                          margin: '2px 0',
                          fontSize: 12,
                          fontFamily: 'var(--font-body)',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <span style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: activeFeature === sub.key ? item.color : 'var(--text-muted)',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontWeight: activeFeature === sub.key ? 600 : 400 }}>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部 */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
          {/* 个人资料 */}
          <button
            onClick={() => handlePageClick('profile')}
            style={{
              width: '100%',
              padding: collapsed ? '8px 0' : '8px 12px',
              border: 'none',
              background: currentPage === 'profile' ? 'var(--bg-glass-hover)' : 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              borderRadius: 'var(--radius-md)',
              marginBottom: 8,
              transition: 'all var(--transition-fast)',
            }}
          >
            <Badge dot color="var(--neon-success)">
              <Avatar size={28} icon={<User size={14} />} style={{ background: 'var(--bg-glass-hover)' }} />
            </Badge>
            {!collapsed && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>我的</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>个人中心</div>
              </div>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 4 }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition-fast)',
              }}>
              {collapsed ? React.createElement(PanelLeft, { size: 18 }) : React.createElement(PanelLeftClose, { size: 18 })}
            </button>
            {!collapsed && (
              <>
                <ThemeToggle size="sm" />
                <button
                  onClick={handleLogout}
                  title="退出登录"
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--transition-fast)',
                  }}>
                  {React.createElement(LogOut, { size: 17 })}
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{
        flex: 1,
        marginLeft: siderWidth + 32,
        padding: '16px 16px 16px 0',
        overflow: 'hidden',
        transition: 'margin-left var(--transition-slow)',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-content)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'auto',
        }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#a855f7',
          colorBgContainer: 'transparent',
          colorBgElevated: 'rgba(30,30,46,0.8)',
          colorText: '#e2e8f0',
          colorTextSecondary: '#94a3b8',
          colorBorder: 'rgba(255,255,255,0.08)',
          borderRadius: 12,
          fontFamily: 'var(--font-body)',
        },
        components: {
          Menu: { itemBg: 'transparent', itemHoverBg: 'rgba(255,255,255,0.06)', itemSelectedBg: 'rgba(168,85,247,0.15)', itemSelectedColor: '#c084fc' },
          Card: { headerBg: 'transparent', colorBorderSecondary: 'rgba(255,255,255,0.06)' },
          Table: { headerBg: 'rgba(255,255,255,0.04)', rowHoverBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' },
          Modal: { contentBg: 'rgba(30,30,46,0.95)', headerBg: 'rgba(30,30,46,0.95)', footerBg: 'rgba(30,30,46,0.95)' },
          Input: { activeBorderColor: '#a855f7', hoverBorderColor: 'rgba(168,85,247,0.5)', activeShadow: '0 0 0 2px rgba(168,85,247,0.2)' },
          Button: { primaryShadow: '0 4px 14px rgba(168,85,247,0.4)' },
          Select: { optionSelectedBg: 'rgba(168,85,247,0.2)', optionActiveBg: 'rgba(255,255,255,0.06)' },
          Tabs: { itemSelectedColor: '#c084fc', inkBarColor: '#a855f7', itemHoverColor: '#e2e8f0' },
          Timeline: { dotBg: 'transparent', itemPaddingBottom: 20 },
          Tag: { defaultBg: 'rgba(255,255,255,0.06)', defaultColor: '#94a3b8' },
          Progress: { defaultColor: '#a855f7', remainingColor: 'rgba(255,255,255,0.06)' },
          Slider: { trackBg: '#a855f7', trackHoverBg: '#c084fc', handleColor: '#a855f7', dotBorderColor: 'rgba(255,255,255,0.2)', railBg: 'rgba(255,255,255,0.1)', railHoverBg: 'rgba(255,255,255,0.15)' },
          Statistic: { contentFontSize: 28 },
          Alert: { colorInfoBg: 'rgba(59,130,246,0.1)', colorInfoBorder: 'rgba(59,130,246,0.2)', colorSuccessBg: 'rgba(16,185,129,0.1)', colorSuccessBorder: 'rgba(16,185,129,0.2)', colorWarningBg: 'rgba(245,158,11,0.1)', colorWarningBorder: 'rgba(245,158,11,0.2)', colorErrorBg: 'rgba(239,68,68,0.1)', colorErrorBorder: 'rgba(239,68,68,0.2)' },
        },
      }}
    >
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;
