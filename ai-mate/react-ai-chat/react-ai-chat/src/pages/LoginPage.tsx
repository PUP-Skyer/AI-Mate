/**
 * 登录/注册页面
 * 左侧品牌区（深色渐变 + 光斑装饰），右侧 antd 表单
 * 根级守卫：未登录时 App 渲染本页
 */

import React, { useState } from 'react';
import { Button, Form, Input, Tabs, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const { login, register } = useAuthStore();
  const { t } = useI18n();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string; password: string; username?: string; confirm?: string }) => {
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(values.email, values.password);
        message.success(t('auth.loginSuccess'));
      } else {
        if (values.password !== values.confirm) {
          message.error(t('auth.pwdMismatch'));
          setLoading(false);
          return;
        }
        await register(values.email, values.password, values.username);
        message.success(t('auth.registerSuccess'));
      }
      // 登录后由 App 守卫自动切换到主界面
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        background: '#0b0f19',
        overflow: 'hidden',
      }}
    >
      {/* 左侧品牌区 */}
      <div
        style={{
          flex: 1.2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 64px',
          color: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        {/* 背景光斑 */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.25), transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-5%',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Space align="center" size={12} style={{ marginBottom: 24 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              青
            </div>
            <div>
              <Text strong style={{ fontSize: 22, color: '#f8fafc', letterSpacing: 2 }}>
                {t('app.name')}
              </Text>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{t('app.tagline')}</div>
            </div>
          </Space>

          <Title level={2} style={{ color: '#f8fafc', marginBottom: 16, fontSize: 32 }}>
            {t('auth.brandSlogan1')}
            <br />
            {t('auth.brandSlogan2')}
          </Title>
          <Text style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8, display: 'block', maxWidth: 420 }}>
            {t('auth.brandDesc')}
          </Text>

          <div style={{ marginTop: 40, display: 'flex', gap: 32 }}>
            {[
              { icon: '🔍', title: t('auth.feature.market'), desc: t('auth.feature.marketDesc') },
              { icon: '🧭', title: t('auth.feature.plan'), desc: t('auth.feature.planDesc') },
              { icon: '⚒️', title: t('auth.feature.make'), desc: t('auth.feature.makeDesc') },
            ].map((f) => (
              <div key={f.title} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 13, color: '#e2e8f0' }}>{f.title}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          borderLeft: '1px solid #1e293b',
        }}
      >
        <div style={{ width: 380, padding: '0 24px' }}>
          <Title level={3} style={{ color: '#f8fafc', marginBottom: 8 }}>
            {tab === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 28, color: '#94a3b8' }}>
            {tab === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </Text>

          <Tabs
            activeKey={tab}
            onChange={(k) => setTab(k as 'login' | 'register')}
            centered
            items={[
              { key: 'login', label: t('auth.login') },
              { key: 'register', label: t('auth.register') },
            ]}
          />

          <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            {tab === 'register' && (
              <Form.Item name="username" label={t('auth.nickname')} style={{ marginBottom: 16 }}>
                <Input
                  prefix={<UserOutlined style={{ color: '#64748b' }} />}
                  placeholder={t('auth.placeholderNickname')}
                  style={{ background: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
              </Form.Item>
            )}
            <Form.Item
              name="email"
              label={t('auth.email')}
              rules={[
                { required: true, message: t('auth.email') },
                { type: 'email', message: t('auth.email') },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#64748b' }} />}
                placeholder={t('auth.placeholderEmail')}
                style={{ background: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t('auth.password')}
              rules={[
                { required: true, message: t('auth.password') },
                { min: 6, message: t('auth.placeholderPassword') },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#64748b' }} />}
                placeholder={t('auth.placeholderPassword')}
                style={{ background: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              />
            </Form.Item>
            {tab === 'register' && (
              <Form.Item
                name="confirm"
                label={t('auth.confirmPassword')}
                rules={[
                  { required: true, message: t('auth.confirmPassword') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error(t('auth.pwdMismatch')));
                    },
                  }),
                ]}
                style={{ marginBottom: 20 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#64748b' }} />}
                  placeholder={t('auth.placeholderConfirm')}
                  style={{ background: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
              </Form.Item>
            )}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none',
                marginTop: 8,
              }}
            >
              {tab === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}
            </Button>
          </Form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button
              type="link"
              size="small"
              style={{ color: '#64748b', fontSize: 12, padding: 0 }}
              onClick={() => {
                const guestUser = {
                  id: 0,
                  email: 'guest@aimate.com',
                  username: 'AI 创业者',
                  nickname: 'AI 创业者',
                  tier: 'free',
                  tierLabel: '免费',
                  quickPassCount: 0,
                };
                localStorage.setItem('ai_mate_token', 'guest-token');
                localStorage.setItem('ai_mate_user', JSON.stringify(guestUser));
                window.location.reload();
              }}
            >
              访客模式直接进入 →
            </Button>
          </div>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              <ThunderboltOutlined style={{ marginRight: 4 }} />
              {t('auth.agreement')}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
