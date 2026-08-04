import React, { useState } from 'react';
import { Card, Form, Input, Button, Tag, Empty, Spin, Space, Tabs, Statistic, Row, Col, Avatar, App, Modal, Badge, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, EditOutlined, HistoryOutlined, WarningOutlined, KeyOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface AccountIssue {
  id: string;
  type: string;
  title: string;
  status: 'open' | 'resolved' | 'pending';
  createTime: string;
  description: string;
  response?: string;
}

const issueTypes: Record<string, { label: string; color: string; icon: string }> = {
  password: { label: '密码问题', color: '#fa8c16', icon: '🔑' },
  login: { label: '登录异常', color: '#f5222d', icon: '🚫' },
  permission: { label: '权限问题', color: '#1890ff', icon: '🔐' },
  data: { label: '数据问题', color: '#722ed1', icon: '📊' },
  other: { label: '其他问题', color: 'var(--text-muted)', icon: '📋' },
};

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
  open: { label: '待解决', color: '#f5222d', icon: '❗' },
  resolved: { label: '已解决', color: '#52c41a', icon: '✅' },
  pending: { label: '处理中', color: '#1890ff', icon: '🔄' },
};

const getIssueTypeConfig = (type: string) => issueTypes[type] || issueTypes.other;

const AccountPanelContent: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { message } = App.useApp();
  const [issues, setIssues] = useState<AccountIssue[]>([
    {
      id: 'AC001',
      type: 'password',
      title: '密码找回问题',
      status: 'resolved',
      createTime: '2026-04-10',
      description: '忘记登录密码，通过手机验证码成功重置',
      response: '已通过手机验证码重置密码，请使用新密码登录',
    },
    {
      id: 'AC002',
      type: 'permission',
      title: '权限申请',
      status: 'pending',
      createTime: '2026-04-22',
      description: '申请高级分析功能的使用权限',
    },
  ]);
  const [searchText, setSearchText] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const handleSubmitIssue = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const newIssue: AccountIssue = {
        id: `AC${Date.now()}`,
        type: values.issueType,
        title: values.title,
        status: 'open',
        createTime: new Date().toISOString().split('T')[0],
        description: values.description,
      };
      setIssues((prev) => [newIssue, ...prev]);
      form.resetFields();
      message.success('问题提交成功');
    } catch (error) {
      message.error('提交失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIssue = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此问题记录吗？',
      onOk: () => {
        setIssues((prev) => prev.filter((i) => i.id !== id));
        message.success('删除成功');
      },
    });
  };

  const handlePasswordSubmit = async () => {
    const values = await passwordForm.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setPasswordSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      passwordForm.resetFields();
      message.success('密码修改成功');
    } catch (error) {
      message.error('密码修改失败，请重试');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const openCount = issues.filter((i) => i.status === 'open').length;
  const pendingCount = issues.filter((i) => i.status === 'pending').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  const filteredIssues = issues.filter((i) => {
    return !searchText || i.title.toLowerCase().includes(searchText.toLowerCase()) || i.description.toLowerCase().includes(searchText.toLowerCase());
  });

  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <UserOutlined />
          账户概览
        </Space>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card size="small">
                <Statistic title="登录状态" value="正常" styles={{ content: { color: '#52c41a' } }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="安全等级" value="高" styles={{ content: { color: '#1890ff' } }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="待处理问题" value={openCount + pendingCount} styles={{ content: { color: openCount + pendingCount > 0 ? '#ff4d4f' : '#52c41a' } }} />
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Badge count={openCount} style={{ backgroundColor: '#f5222d' }}>
                  <Card size="small" style={{ textAlign: 'center', background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8 }}>
                    <CloseCircleOutlined style={{ fontSize: 24, color: '#f5222d', marginBottom: 4 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>待解决</div>
                  </Card>
                </Badge>
              </Col>
              <Col span={8}>
                <Badge count={pendingCount} style={{ backgroundColor: '#1890ff' }}>
                  <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8 }}>
                    <HistoryOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 4 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>处理中</div>
                  </Card>
                </Badge>
              </Col>
              <Col span={8}>
                <Badge count={resolvedCount} style={{ backgroundColor: '#52c41a' }}>
                  <Card size="small" style={{ textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 4 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已解决</div>
                  </Card>
                </Badge>
              </Col>
            </Row>
          </div>

          <Alert
            title="账户安全建议"
            description={
              <Space orientation="vertical" style={{ width: '100%' }} size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyOutlined style={{ color: '#52c41a' }} />
                  <span>定期更换密码，建议每3个月更新一次</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyOutlined style={{ color: '#52c41a' }} />
                  <span>开启两步验证，提升账户安全性</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  <span>不要在公共网络环境下登录账户</span>
                </div>
              </Space>
            }
            type="info"
            showIcon
            icon={<SafetyOutlined />}
            style={{ marginTop: 16, borderRadius: 8 }}
          />
        </div>
      ),
    },
    {
      key: 'submit',
      label: (
        <Space>
          <EditOutlined />
          问题提交
        </Space>
      ),
      children: (
        <Form form={form} layout="vertical" size="middle">
          <Alert title="请详细描述您遇到的问题，我们将尽快为您处理" type="info" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
          <Form.Item name="issueType" label="问题类型" rules={[{ required: true, message: '请选择问题类型' }]}>
            <Input.Group compact>
              {Object.entries(issueTypes).map(([key, config]) => (
                <Tag
                  key={key}
                  color={config.color}
                  style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 13, borderRadius: 16, border: 'none', marginBottom: 8 }}
                  onClick={() => form.setFieldsValue({ issueType: key })}
                >
                  {config.icon} {config.label}
                </Tag>
              ))}
            </Input.Group>
          </Form.Item>
          <Form.Item name="issueType" hidden rules={[{ required: true, message: '请选择问题类型' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="问题标题" rules={[{ required: true, message: '请输入问题标题' }]}>
            <Input placeholder="简要描述问题" prefix={<EditOutlined />} size="large" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label="详细描述" rules={[{ required: true, message: '请描述您遇到的问题' }]}>
            <TextArea placeholder="请详细描述您遇到的问题..." rows={4} style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSubmitIssue} loading={loading} block size="large" style={{ borderRadius: 8, height: 44 }}>
              提交问题
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'records',
      label: (
        <Space>
          <HistoryOutlined />
          处理记录
        </Space>
      ),
      children: (
        <div>
          <Input
            placeholder="搜索问题记录..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 12, borderRadius: 8 }}
            size="small"
          />
          {filteredIssues.length === 0 ? (
            <Empty description="暂无问题记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredIssues.map((item) => {
                const typeConfig = getIssueTypeConfig(item.type);
                const statusInfo = statusMap[item.status] || statusMap.open;
                return (
                  <Card
                    key={item.id}
                    hoverable
                    size="small"
                    style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    styles={{ body: { padding: '12px' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Avatar size={32} style={{ background: typeConfig.color, flexShrink: 0 }}>
                        {typeConfig.icon}
                      </Avatar>
                      <div style={{ marginLeft: 12, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{item.title}</span>
                          <Tag color={statusInfo.color} style={{ borderRadius: 12, padding: '2px 10px' }}>
                            {statusInfo.icon} {statusInfo.label}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>{item.description}</div>
                        {item.response && (
                          <div
                            style={{
                              fontSize: 13,
                              color: '#1890ff',
                              background: '#e6f7ff',
                              padding: '6px 10px',
                              borderRadius: 8,
                              lineHeight: 1.6,
                              borderLeft: '3px solid #1890ff',
                              marginBottom: 6,
                            }}
                          >
                            <CheckCircleOutlined style={{ marginRight: 4 }} />
                            {item.response}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.createTime}</span>
                          <Space size="small">
                            <Button type="text" size="small" icon={<EyeOutlined />}>
                              查看
                            </Button>
                            {item.status === 'open' && (
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteIssue(item.id)}>
                                删除
                              </Button>
                            )}
                          </Space>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'password',
      label: (
        <Space>
          <KeyOutlined />
          密码管理
        </Space>
      ),
      children: (
        <div>
          <Alert title="为了账户安全，请定期更换密码" type="warning" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
          <Form form={passwordForm} layout="vertical" size="middle">
            <Form.Item label="当前密码" name="currentPassword" rules={[{ required: true, message: '请输入当前密码' }]}>
              <Input.Password placeholder="输入当前密码" prefix={<LockOutlined />} size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少6位' }]}>
              <Input.Password placeholder="输入新密码（至少6位）" prefix={<KeyOutlined />} size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item label="确认新密码" name="confirmPassword" rules={[{ required: true, message: '请确认新密码' }, { min: 6, message: '密码长度至少6位' }]}>
              <Input.Password placeholder="再次输入新密码" prefix={<KeyOutlined />} size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<LockOutlined />} onClick={handlePasswordSubmit} loading={passwordSubmitting} block size="large" style={{ borderRadius: 8, height: 44 }}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span>账户问题处理</span>
        </Space>
      }
      size="small"
      styles={{ body: { padding: '12px', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' } }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Card>
  );
};

const AccountPanel: React.FC = () => (
  <App>
    <AccountPanelContent />
  </App>
);

export default AccountPanel;
