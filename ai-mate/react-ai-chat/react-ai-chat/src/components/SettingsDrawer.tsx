/**
 * 设置抽屉面板
 * 右侧滑出的账号与设置面板，支持 账号 / 通用 / 模型 三个标签页
 */

import React, { useState } from 'react';
import {
  Drawer,
  Avatar,
  Button,
  Tag,
  Space,
  Switch,
  Segmented,
  Select,
  Typography,
  Row,
  Col,
  Form,
  Input,
  Modal,
  message,
} from 'antd';
import {
  ThunderboltOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAIStore } from '../store/aiStore';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n';
import type { ThemeType, LanguageType, SettingsTab, ModelConfig } from '../types';
import ModelList from './ModelList';
import AddModelModal from './AddModelModal';

const { Title, Text } = Typography;

const SettingsDrawer: React.FC = () => {
  const {
    userInfo,
    settings,
    settingsDrawerOpen,
    toggleSettingsDrawer,
    updateSettings,
    settingsTab,
    setSettingsTab,
  } = useAIStore();
  const { userInfo: authUser, changePassword, logout } = useAuthStore();
  const { t } = useI18n();

  // 模型弹窗状态
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  // 改密弹窗状态
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdForm] = Form.useForm();

  // 展示用用户信息：优先登录用户，回退 aiStore
  const displayUser = {
    nickname: authUser?.nickname || authUser?.username || userInfo.nickname,
    email: authUser?.email || '',
    phone: userInfo.phone,
    id: authUser?.id ? String(authUser.id) : userInfo.id,
    tierLabel: authUser?.tierLabel || userInfo.tierLabel,
    quickPassCount: authUser?.quickPassCount ?? userInfo.quickPassCount,
  };

  const showAddModelModal = () => {
    setEditingModel(null);
    setModelModalOpen(true);
  };

  const showEditModelModal = (config: ModelConfig) => {
    setEditingModel(config);
    setModelModalOpen(true);
  };

  const closeModelModal = () => {
    setModelModalOpen(false);
    setEditingModel(null);
  };

  // 修改密码
  const handleChangePassword = async () => {
    try {
      const values = await pwdForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error(t('settings.pwdMismatch'));
        return;
      }
      setPwdLoading(true);
      await changePassword(values.oldPassword, values.newPassword);
      message.success(t('settings.pwdSuccess'));
      setPwdModalOpen(false);
      pwdForm.resetFields();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || '修改密码失败');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  // 手机号脱敏
  const maskPhone = (phone: string) => {
    if (phone.length !== 11) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  };

  // 根据标签页动态标题
  const tabTitleMap: Record<SettingsTab, string> = {
    account: t('settings.tab.account'),
    general: t('settings.tab.general'),
    model: t('settings.tab.model'),
  };

  // ============ 渲染各标签页内容 ============

  const renderAccountTab = () => (
    <div style={{ padding: '4px 0 20px' }}>
      {/* ① 用户信息卡片 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar
          size={48}
          style={{ background: '#fadb14', color: '#262626', fontWeight: 600, fontSize: 18 }}
        >
          {displayUser.nickname.charAt(0).toUpperCase()}
        </Avatar>
        <div>
          <Text strong style={{ fontSize: 16, display: 'block', color: '#262626' }}>
            {displayUser.nickname}
          </Text>
          <Tag
            style={{
              marginTop: 4,
              background: '#595959',
              color: '#fff',
              border: 'none',
              fontSize: 12,
            }}
          >
            {displayUser.tierLabel}
          </Tag>
        </div>
      </div>

      {/* ② 账号信息区块 */}
      <div
        style={{
          background: '#fafafa',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary" style={{ fontSize: 13 }}>{t('settings.userId')}</Text>
            </Col>
            <Col>
              <Text style={{ fontSize: 13 }}>{displayUser.id}</Text>
            </Col>
          </Row>
          {displayUser.email && (
            <Row justify="space-between" align="middle">
              <Col>
                <Text type="secondary" style={{ fontSize: 13 }}>{t('settings.email')}</Text>
              </Col>
              <Col>
                <Text style={{ fontSize: 13 }}>{displayUser.email}</Text>
              </Col>
            </Row>
          )}
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary" style={{ fontSize: 13 }}>{t('settings.phone')}</Text>
            </Col>
            <Col>
              <Text style={{ fontSize: 13 }}>{maskPhone(displayUser.phone)}</Text>
            </Col>
          </Row>
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary" style={{ fontSize: 13 }}>{t('settings.changePassword')}</Text>
            </Col>
            <Col>
              <Button size="small" icon={<LockOutlined />} onClick={() => setPwdModalOpen(true)}>
                {t('settings.changePassword')}
              </Button>
            </Col>
          </Row>
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary" style={{ fontSize: 13 }}>{t('settings.upgrade')}</Text>
            </Col>
            <Col>
              <Button type="primary" ghost size="small">
                {t('settings.upgrade')}
              </Button>
            </Col>
          </Row>
        </Space>
      </div>

      {/* ③ 速通用量区块 */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
          {t('settings.quickPass')}
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          {t('settings.quickPassHint')}
        </Text>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <ThunderboltOutlined style={{ color: '#faad14' }} />
              <Text style={{ fontSize: 13 }}>
                {t('settings.quickPassAvailable', { count: displayUser.quickPassCount })}
              </Text>
            </Space>
          </Col>
          <Col>
            <Button type="link" size="small">
              {t('settings.coupon')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* ④ 底部操作 */}
      <Button danger block size="middle" onClick={logout}>
        {t('settings.logout')}
      </Button>
    </div>
  );

  const renderGeneralTab = () => (
    <div style={{ padding: '4px 0 20px' }}>
      {/* 偏好设置区块 */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>
          {t('settings.preferences')}
        </Text>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ fontSize: 13 }}>{t('settings.privacyMode')}</Text>
            </Col>
            <Col>
              <Switch
                size="small"
                checked={settings.privacyMode}
                onChange={(checked) => updateSettings({ privacyMode: checked })}
              />
            </Col>
          </Row>
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ fontSize: 13 }}>{t('settings.notifications')}</Text>
            </Col>
            <Col>
              <Switch
                size="small"
                checked={settings.notificationsEnabled}
                onChange={(checked) => updateSettings({ notificationsEnabled: checked })}
              />
            </Col>
          </Row>
        </Space>
      </div>

      {/* 外观设置区块 */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>
          {t('settings.appearance')}
        </Text>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ fontSize: 13 }}>{t('settings.theme')}</Text>
            </Col>
            <Col>
              <Segmented
                size="small"
                value={settings.theme}
                onChange={(val) => updateSettings({ theme: val as ThemeType })}
                options={[
                  { label: t('settings.themeLight'), value: 'light' },
                  { label: t('settings.themeDark'), value: 'dark' },
                ]}
              />
            </Col>
          </Row>
          <Row justify="space-between" align="middle">
            <Col>
              <Text style={{ fontSize: 13 }}>{t('settings.language')}</Text>
            </Col>
            <Col>
              <Select
                size="small"
                value={settings.language}
                onChange={(val) => updateSettings({ language: val as LanguageType })}
                style={{ width: 120 }}
                options={[
                  { label: t('settings.langZh'), value: 'zh-CN' },
                  { label: t('settings.langEn'), value: 'en' },
                ]}
              />
            </Col>
          </Row>
        </Space>
      </div>
    </div>
  );

  const renderModelTab = () => (
    <div style={{ padding: '4px 0 20px' }}>
      <ModelList onAddModel={showAddModelModal} onEditModel={showEditModelModal} />
    </div>
  );

  const tabContentMap: Record<SettingsTab, React.ReactNode> = {
    account: renderAccountTab(),
    general: renderGeneralTab(),
    model: renderModelTab(),
  };

  return (
    <>
      <Drawer
        title={tabTitleMap[settingsTab]}
        placement="right"
        width={420}
        open={settingsDrawerOpen}
        onClose={() => toggleSettingsDrawer(false)}
        closable
      >
        {/* 标签页切换 */}
        <Segmented
          value={settingsTab}
          onChange={(val) => setSettingsTab(val as SettingsTab)}
          block
          options={[
            { label: t('settings.tab.account'), value: 'account' },
            { label: t('settings.tab.general'), value: 'general' },
            { label: t('settings.tab.model'), value: 'model' },
          ]}
          style={{ marginBottom: 20 }}
        />

        {/* 标签页内容 */}
        {tabContentMap[settingsTab]}
      </Drawer>

      {/* 模型配置弹窗 */}
      <AddModelModal
        open={modelModalOpen}
        editConfig={editingModel}
        onClose={closeModelModal}
      />

      {/* 修改密码弹窗 */}
      <Modal
        title={t('settings.pwdModalTitle')}
        open={pwdModalOpen}
        onOk={handleChangePassword}
        onCancel={() => setPwdModalOpen(false)}
        confirmLoading={pwdLoading}
        okText={t('settings.pwdOk')}
        cancelText={t('common.cancel')}
      >
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="oldPassword"
            label={t('settings.pwdOld')}
            rules={[{ required: true, message: t('settings.pwdOld') }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder={t('settings.pwdOldPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('settings.pwdNew')}
            rules={[
              { required: true, message: t('settings.pwdNew') },
              { min: 6, message: t('settings.pwdNewPlaceholder') },
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder={t('settings.pwdNewPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('settings.pwdConfirm')}
            rules={[{ required: true, message: t('settings.pwdConfirm') }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder={t('settings.pwdConfirmPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SettingsDrawer;
