import React, { useState, useEffect } from 'react';
import { Input, Typography, App } from 'antd';
import {
  GraduationCap,
  Award,
  Settings,
  ArrowRight,
  Compass,
  Mail,
  Lock,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

type PortalType = 'student' | 'investor' | 'expert' | 'admin';

interface PortalOption {
  id: PortalType;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  features: string[];
  accentColor: string;
}

const PORTALS: PortalOption[] = [
  {
    id: 'student',
    icon: GraduationCap,
    title: '学生端',
    subtitle: '创业者使用',
    features: ['AI数字员工对话', '资源匹配', '社区交流'],
    accentColor: '#3B82F6',
  },
  {
    id: 'investor',
    icon: Wallet,
    title: '投资端',
    subtitle: '投资人使用',
    features: ['项目浏览', '融资对接', '投资管理'],
    accentColor: '#10B981',
  },
  {
    id: 'expert',
    icon: Award,
    title: '专家端',
    subtitle: '评审专家使用',
    features: ['项目评审', '打分反馈', '专业指导'],
    accentColor: '#8B5CF6',
  },
  {
    id: 'admin',
    icon: Settings,
    title: '管理端',
    subtitle: '运营团队使用',
    features: ['用户管理', '项目管理', '数据看板'],
    accentColor: '#F59E0B',
  },
];

interface LoginPageProps {
  onLoginSuccess: (role: PortalType) => void;
}

const PortalCard: React.FC<{
  portal: PortalOption;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}> = ({ portal, isSelected, onClick, index }) => {
  const Icon = portal.icon;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 200 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 16px',
        textAlign: 'left',
        background: isSelected
          ? `${portal.accentColor}12`
          : 'rgba(255, 255, 255, 0.03)',
        border: isSelected
          ? `1.5px solid ${portal.accentColor}40`
          : '1.5px solid var(--border-light)',
        boxShadow: isSelected
          ? `0 0 24px ${portal.accentColor}20, inset 0 1px 0 ${portal.accentColor}15`
          : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: portal.accentColor,
          borderRadius: '0 2px 2px 0',
          transform: isSelected ? 'scaleY(1)' : 'scaleY(0)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${portal.accentColor}20`,
          color: portal.accentColor,
          marginBottom: 12,
        }}
      >
        <Icon size={22} />
      </div>

      <h3
        style={{
          margin: '0 0 4px',
          fontSize: 16,
          fontWeight: 600,
          color: '#E2E8F0',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {portal.title}
      </h3>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#94A3B8' }}>
        {portal.subtitle}
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {portal.features.map((feature, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: '#94A3B8',
              marginBottom: 2,
            }}
          >
            <Sparkles size={11} color={portal.accentColor} style={{ flexShrink: 0 }} />
            {feature}
          </li>
        ))}
      </ul>

      {isSelected && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: portal.accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
};

const LoginForm: React.FC<{
  selectedPortal: PortalType;
  onSubmit: (credentials: { email: string; password: string }) => void;
}> = ({ selectedPortal, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const { message } = App.useApp();

  const portal = PORTALS.find((p) => p.id === selectedPortal)!;
  const PortalIcon = portal.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      message.warning('请输入邮箱和密码');
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    onSubmit({ email, password });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 12,
          background: `${portal.accentColor}12`,
          border: `1px solid ${portal.accentColor}20`,
          marginBottom: 8,
        }}
      >
        <PortalIcon size={18} color={portal.accentColor} />
        <span style={{ fontSize: 13, color: '#E2E8F0' }}>
          正在以{' '}
          <span style={{ color: portal.accentColor, fontWeight: 600 }}>
            {portal.title}
          </span>{' '}
          身份登录
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#CBD5E1' }}>
          邮箱
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border:
              focused === 'email'
                ? `1.5px solid ${portal.accentColor}60`
                : '1.5px solid var(--border-light)',
            boxShadow:
              focused === 'email'
                ? `0 0 12px ${portal.accentColor}15`
                : 'none',
            transition: 'all var(--transition-normal)',
          }}
        >
          <Mail size={16} color="#64748B" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            placeholder="请输入邮箱地址"
            required
            style={{
              flex: 1,
              height: 40,
              border: 'none',
              background: 'transparent',
              color: '#E2E8F0',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#CBD5E1' }}>
          密码
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border:
              focused === 'password'
                ? `1.5px solid ${portal.accentColor}60`
                : '1.5px solid var(--border-light)',
            boxShadow:
              focused === 'password'
                ? `0 0 12px ${portal.accentColor}15`
                : 'none',
            transition: 'all var(--transition-normal)',
          }}
        >
          <Lock size={16} color="#64748B" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            placeholder="请输入密码"
            required
            style={{
              flex: 1,
              height: 40,
              border: 'none',
              background: 'transparent',
              color: '#E2E8F0',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: 46,
          borderRadius: 12,
          border: 'none',
          background: `linear-gradient(135deg, ${portal.accentColor}, ${portal.accentColor}dd)`,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          fontFamily: 'var(--font-body)',
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all var(--transition-fast)',
          boxShadow: `0 4px 16px ${portal.accentColor}30`,
        }}
      >
        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLoading ? '登录中...' : '登录'}
          {!isLoading && <ArrowRight size={16} />}
        </span>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.5s ease',
          }}
        />
      </button>

      <p
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#94A3B8',
          margin: 0,
        }}
      >
        还没有账号？{' '}
        <span
          style={{
            color: portal.accentColor,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          立即注册
        </span>
      </p>
    </form>
  );
};

const LoginPageContent: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('student');
  const [entered, setEntered] = useState(false);
  const { isDarkMode } = useTheme();
  const { message } = App.useApp();

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (_credentials: { email: string; password: string }) => {
    try {
      const token = `login-token-${Date.now()}`;
      localStorage.setItem('ai-mate-token', token);
      localStorage.setItem('ai-mate-role', selectedPortal);
      message.success('登录成功');
      onLoginSuccess(selectedPortal);
    } catch {
      message.error('登录失败，请重试');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background:
          'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E40AF 100%)',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* 装饰光斑 */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'rgba(59,130,246,0.12)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '-8%',
          width: '35vw',
          height: '35vw',
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.1)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '25%',
          width: '30vw',
          height: '30vw',
          borderRadius: '50%',
          background: 'rgba(16,185,129,0.08)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* 网格背景 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      {/* 主内容 */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 960,
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: 16,
                boxShadow: '0 8px 32px rgba(124,58,237,0.15)',
              }}
            >
              <Compass size={36} color="#A78BFA" />
            </div>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: 32,
                fontWeight: 700,
                color: '#F8FAFC',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.5px',
              }}
            >
              青宸智汇
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#94A3B8' }}>
              青宸智汇 · AI集群创投赋能平台
            </p>
          </div>

          {/* 主卡片 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderRadius: 24,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.3)',
            }}
          >
            {/* 左侧：端选择 */}
            <div
              style={{
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#E2E8F0',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                选择登录身份
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  flex: 1,
                }}
              >
                {PORTALS.map((portal, index) => (
                  <PortalCard
                    key={portal.id}
                    portal={portal}
                    isSelected={selectedPortal === portal.id}
                    onClick={() => setSelectedPortal(portal.id)}
                    index={index}
                  />
                ))}
              </div>
            </div>

            {/* 右侧：登录表单 */}
            <div
              style={{
                padding: '28px 28px',
                background: 'rgba(255,255,255,0.03)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <h2
                style={{
                  margin: '0 0 20px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#E2E8F0',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                账号登录
              </h2>
              <LoginForm
                selectedPortal={selectedPortal}
                onSubmit={handleLogin}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage: React.FC<LoginPageProps> = (props) => (
  <App>
    <LoginPageContent {...props} />
  </App>
);

export default LoginPage;
