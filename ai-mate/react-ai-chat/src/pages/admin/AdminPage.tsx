/**
 * 管理端主页面
 * 平台管理、用户管理（增删改查）、项目管理（增删改查）、数据统计、系统设置
 */

import React, { useState } from 'react';
import { Card, Tag, Button, Avatar, Badge, Progress, Row, Col, Statistic, Table, Tabs, Modal, Form, Input, Select, App, Popconfirm, Space } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ProjectOutlined,
} from '@ant-design/icons';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  projects: number;
}

interface Project {
  id: string;
  name: string;
  stage: string;
  industry: string;
  amount: string;
  team: string;
  status: 'raising' | 'closed' | 'completed';
  createdAt: string;
}

interface SystemMetric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

const roleOptions = [
  { value: '学生', label: '学生', color: 'blue' },
  { value: '投资人', label: '投资人', color: 'green' },
  { value: '专家', label: '专家', color: 'purple' },
  { value: '管理员', label: '管理员', color: 'red' },
];

const stageOptions = [
  { value: '种子轮', color: '#52c41a' },
  { value: '天使轮', color: '#1890ff' },
  { value: 'Pre-A轮', color: '#faad14' },
  { value: 'ABC轮', color: '#722ed1' },
];

const industryOptions = ['教育科技', '新能源', '医疗科技', '金融科技', '自动驾驶', '企业服务', '跨境电商', '智慧城市'];

const AdminPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { message } = App.useApp();

  // 用户管理状态
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: '张三', email: 'zhangsan@example.com', role: '学生', status: 'active', lastLogin: '2026-05-01', projects: 3 },
    { id: '2', name: '李四', email: 'lisi@example.com', role: '投资人', status: 'active', lastLogin: '2026-05-01', projects: 5 },
    { id: '3', name: '王五', email: 'wangwu@example.com', role: '专家', status: 'active', lastLogin: '2026-04-30', projects: 8 },
    { id: '4', name: '赵六', email: 'zhaoliu@example.com', role: '学生', status: 'pending', lastLogin: '2026-04-28', projects: 1 },
    { id: '5', name: '钱七', email: 'qianqi@example.com', role: '投资人', status: 'inactive', lastLogin: '2026-04-15', projects: 0 },
  ]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userEditing, setUserEditing] = useState<User | null>(null);
  const [userForm] = Form.useForm();
  const [userSearchText, setUserSearchText] = useState('');

  // 项目管理状态
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: '智能教育助手', stage: '种子轮', industry: '教育科技', amount: '200万', team: '创新者联盟', status: 'raising', createdAt: '2026-04-01' },
    { id: '2', name: '绿色能源管理', stage: '种子轮', industry: '新能源', amount: '300万', team: '绿源科技', status: 'raising', createdAt: '2026-04-05' },
    { id: '3', name: '医疗影像AI', stage: '天使轮', industry: '医疗科技', amount: '800万', team: '医疗先锋', status: 'raising', createdAt: '2026-03-20' },
    { id: '4', name: '供应链金融平台', stage: '天使轮', industry: '金融科技', amount: '1000万', team: '链上金融', status: 'raising', createdAt: '2026-03-15' },
    { id: '5', name: '自动驾驶感知', stage: 'Pre-A轮', industry: '自动驾驶', amount: '3000万', team: '智驾未来', status: 'raising', createdAt: '2026-02-28' },
  ]);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [projectEditing, setProjectEditing] = useState<Project | null>(null);
  const [projectForm] = Form.useForm();
  const [projectSearchText, setProjectSearchText] = useState('');

  const systemMetrics: SystemMetric[] = [
    { name: '日活跃用户', value: 1250, trend: 'up', change: 12.5 },
    { name: '新增用户', value: 86, trend: 'up', change: 8.3 },
    { name: '项目提交', value: 34, trend: 'up', change: 15.2 },
    { name: '系统负载', value: 45, trend: 'stable', change: 0 },
  ];

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
      case 'raising':
        return <Tag color="success">正常</Tag>;
      case 'inactive':
      case 'closed':
        return <Tag color="default">停用</Tag>;
      case 'pending':
        return <Tag color="warning">待审核</Tag>;
      case 'completed':
        return <Tag color="blue">已完成</Tag>;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'down':
        return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <span style={{ color: '#faad14' }}>-</span>;
    }
  };

  // ========== 用户管理增删改查 ==========

  const handleAddUser = () => {
    setUserEditing(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (record: User) => {
    setUserEditing(record);
    userForm.setFieldsValue(record);
    setUserModalVisible(true);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    message.success('删除用户成功');
  };

  const handleUserModalOk = async () => {
    try {
      const values = await userForm.validateFields();
      if (userEditing) {
        // 编辑
        setUsers(users.map(u => u.id === userEditing.id ? { ...u, ...values } : u));
        message.success('更新用户成功');
      } else {
        // 新增
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          lastLogin: '-',
          projects: 0,
        };
        setUsers([...users, newUser]);
        message.success('添加用户成功');
      }
      setUserModalVisible(false);
    } catch (err) {
      console.error('表单验证失败:', err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.includes(userSearchText) ||
    u.email.includes(userSearchText) ||
    u.role.includes(userSearchText)
  );

  // ========== 项目管理增删改查 ==========

  const handleAddProject = () => {
    setProjectEditing(null);
    projectForm.resetFields();
    setProjectModalVisible(true);
  };

  const handleEditProject = (record: Project) => {
    setProjectEditing(record);
    projectForm.setFieldsValue(record);
    setProjectModalVisible(true);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    message.success('删除项目成功');
  };

  const handleProjectModalOk = async () => {
    try {
      const values = await projectForm.validateFields();
      if (projectEditing) {
        setProjects(projects.map(p => p.id === projectEditing.id ? { ...p, ...values } : p));
        message.success('更新项目成功');
      } else {
        const newProject: Project = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setProjects([...projects, newProject]);
        message.success('添加项目成功');
      }
      setProjectModalVisible(false);
    } catch (err) {
      console.error('表单验证失败:', err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.includes(projectSearchText) ||
    p.team.includes(projectSearchText) ||
    p.industry.includes(projectSearchText)
  );

  // 表格列定义
  const userColumns = [
    {
      title: '用户',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={32} style={{ background: '#1890ff' }}>{text[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const config = roleOptions.find(r => r.value === role);
        return <Tag color={config?.color || 'default'}>{role}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
    },
    {
      title: '项目数',
      dataIndex: 'projects',
      key: 'projects',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除用户"${record.name}" 吗？`}
            onConfirm={() => handleDeleteUser(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={32} style={{ background: '#52c41a' }}>{text[0]}</Avatar>
          <span style={{ fontWeight: 500 }}>{text}</span>
        </div>
      ),
    },
    {
      title: '融资阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => {
        const config = stageOptions.find(s => s.value === stage);
        return <Tag color={config?.color || 'default'}>{stage}</Tag>;
      },
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
    },
    {
      title: '融资金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => <span style={{ color: '#fa541c', fontWeight: 500 }}>¥{amount}</span>,
    },
    {
      title: '团队',
      dataIndex: 'team',
      key: 'team',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditProject(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除项目"${record.name}" 吗？`}
            onConfirm={() => handleDeleteProject(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined style={{ marginRight: 8 }} />
          总览
        </span>
      ),
      children: (
        <div>
          {/* 系统指标 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            {systemMetrics.map((metric, index) => (
              <Col span={6} key={index}>
                <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{metric.name}</div>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1a1a2e' }}>{metric.value}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {getTrendIcon(metric.trend)}
                      <span style={{ fontSize: 13, color: metric.trend === 'up' ? '#52c41a' : metric.trend === 'down' ? '#ff4d4f' : '#faad14' }}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 平台统计 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card
                title={<span><TeamOutlined style={{ marginRight: 8 }} />用户分布</span>}
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: '学生用户', count: users.filter(u => u.role === '学生').length, total: users.length, color: '#1890ff' },
                    { label: '投资人', count: users.filter(u => u.role === '投资人').length, total: users.length, color: '#52c41a' },
                    { label: '专家', count: users.filter(u => u.role === '专家').length, total: users.length, color: '#faad14' },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span style={{ fontWeight: 500 }}>{item.count}人 ({item.total > 0 ? Math.round((item.count / item.total) * 100) : 0}%)</span>
                      </div>
                      <Progress percent={item.total > 0 ? Math.round((item.count / item.total) * 100) : 0} strokeColor={item.color} showInfo={false} size="small" />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                title={<span><BarChartOutlined style={{ marginRight: 8 }} />项目统计</span>}
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {stageOptions.map((stage, idx) => {
                    const count = projects.filter(p => p.stage === stage.value).length;
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{stage.value}项目</span>
                          <span style={{ fontWeight: 500 }}>{count}个</span>
                        </div>
                        <Progress percent={projects.length > 0 ? Math.round((count / projects.length) * 100) : 0} strokeColor={stage.color} showInfo={false} size="small" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          用户管理
        </span>
      ),
      children: (
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Input
              placeholder="搜索用户..."
              prefix={<SearchOutlined />}
              value={userSearchText}
              onChange={(e) => setUserSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
              添加用户
            </Button>
          </div>
          <Table
            dataSource={filteredUsers}
            columns={userColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'projects',
      label: (
        <span>
          <ProjectOutlined style={{ marginRight: 8 }} />
          项目管理
        </span>
      ),
      children: (
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Input
              placeholder="搜索项目..."
              prefix={<SearchOutlined />}
              value={projectSearchText}
              onChange={(e) => setProjectSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProject}>
              添加项目
            </Button>
          </div>
          <Table
            dataSource={filteredProjects}
            columns={projectColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'settings',
      label: (
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          系统设置
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title="平台配置"
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: '用户注册审核', status: true, description: '新用户注册是否需要管理员审核' },
                { label: '项目提交审核', status: true, description: '新项目提交是否需要管理员审核' },
                { label: '专家评分公开', status: false, description: '专家评审结果是否对所有用户可见' },
                { label: '融资信息公开', status: true, description: '融资进度是否对所有用户可见' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx < 3 ? '1px solid #f0f0f0' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#333' }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{item.description}</div>
                  </div>
                  <Tag color={item.status ? 'success' : 'default'}>{item.status ? '已开启' : '已关闭'}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)', minHeight: '100vh' }}>
      {/* 顶部标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1a1a2e' }}>管理后台</h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>平台运营数据监控与系统管理</p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ background: '#fff', padding: '0 24px', borderRadius: 12 }}
      />

      {/* 用户编辑/新增弹窗 */}
      <Modal
        title={userEditing ? '编辑用户' : '添加用户'}
        open={userModalVisible}
        onOk={handleUserModalOk}
        onCancel={() => setUserModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={userForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roleOptions.map(role => (
                <Select.Option key={role.value} value={role.value}>{role.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="active">正常</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="pending">待审核</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 项目编辑/新增弹窗 */}
      <Modal
        title={projectEditing ? '编辑项目' : '添加项目'}
        open={projectModalVisible}
        onOk={handleProjectModalOk}
        onCancel={() => setProjectModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={projectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="stage"
            label="融资阶段"
            rules={[{ required: true, message: '请选择融资阶段' }]}
          >
            <Select placeholder="请选择融资阶段">
              {stageOptions.map(stage => (
                <Select.Option key={stage.value} value={stage.value}>{stage.value}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="industry"
            label="行业"
            rules={[{ required: true, message: '请选择行业' }]}
          >
            <Select placeholder="请选择行业">
              {industryOptions.map(industry => (
                <Select.Option key={industry} value={industry}>{industry}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="融资金额"
            rules={[{ required: true, message: '请输入融资金额' }]}
          >
            <Input placeholder="例如：200万" />
          </Form.Item>
          <Form.Item
            name="team"
            label="团队名称"
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="请输入团队名称" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="raising">融资中</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const AdminPage: React.FC = () => (
  <App>
    <AdminPageContent />
  </App>
);

export default AdminPage;
