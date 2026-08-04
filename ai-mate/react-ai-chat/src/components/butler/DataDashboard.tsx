/**
 * 数据面板 - 创业进度实时监控
 * 功能：创业进度、供应商管理、投资商合作、实时通知
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Timeline,
  Tag,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Badge,
  Space,
  Tabs,
  Alert,
  notification,
  Popconfirm,
  Tooltip,
  Divider,
} from 'antd';
import {
  DashboardOutlined,
  RiseOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  TrophyOutlined,
  FireOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { Line, Pie, Bar } from '@ant-design/charts';

const { Option } = Select;
const { TabPane } = Tabs;

// 模拟创业进度数据
const progressData = {
  overall: 65,
  stages: [
    { name: '市场调研', progress: 100, status: 'completed', date: '2024-01-15' },
    { name: '产品设计', progress: 100, status: 'completed', date: '2024-02-01' },
    { name: '技术开发', progress: 80, status: 'inProgress', date: '2024-03-01' },
    { name: '营销推广', progress: 45, status: 'inProgress', date: '2024-03-15' },
    { name: '客户获取', progress: 20, status: 'pending', date: '-' },
    { name: '收入变现', progress: 0, status: 'pending', date: '-' },
  ],
  metrics: {
    totalTasks: 48,
    completedTasks: 31,
    pendingTasks: 12,
    highPriorityTasks: 5,
  },
  weeklyProgress: [
    { week: '第1周', completed: 5, total: 8 },
    { week: '第2周', completed: 8, total: 10 },
    { week: '第3周', completed: 12, total: 15 },
    { week: '第4周', completed: 6, total: 15 },
  ],
};

// 模拟通知数据
const notifications = [
  { id: 1, type: 'success', message: '技术开发阶段完成80%', time: '10分钟前' },
  { id: 2, type: 'warning', message: '高优先级任务待处理：完成产品原型设计', time: '1小时前' },
  { id: 3, type: 'info', message: '新供应商"营销代理C"已添加', time: '2小时前' },
  { id: 4, type: 'success', message: '天使投资人A的投资款已到账', time: '1天前' },
];

// 模拟供应商数据
const initialSuppliers = [
  { id: 1, name: '云服务提供商A', type: '技术', status: '合作中', contact: '张经理', phone: '13800138001', cooperationCount: 3, lastCooperation: '2024-01-15', rating: 4.5 },
  { id: 2, name: '设计工作室B', type: '设计', status: '合作中', contact: '李总监', phone: '13900139002', cooperationCount: 5, lastCooperation: '2024-02-20', rating: 4.8 },
  { id: 3, name: '营销代理C', type: '营销', status: '洽谈中', contact: '王经理', phone: '13700137003', cooperationCount: 0, lastCooperation: '-', rating: 0 },
  { id: 4, name: '法律咨询D', type: '法务', status: '合作中', contact: '赵律师', phone: '13600136004', cooperationCount: 2, lastCooperation: '2024-03-01', rating: 4.2 },
];

// 模拟投资商数据
const initialInvestors = [
  { id: 1, name: '天使投资人A', type: '天使轮', amount: '50万', status: '已投资', date: '2024-01-10', equity: '10%', contact: '陈总' },
  { id: 2, name: '创投基金B', type: 'Pre-A轮', amount: '200万', status: '洽谈中', date: '-', equity: '待定', contact: '刘经理' },
  { id: 3, name: '政府扶持基金', type: '补贴', amount: '20万', status: '已到账', date: '2024-02-15', equity: '0%', contact: '周主任' },
];

const DataDashboard: React.FC = () => {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [investors, setInvestors] = useState(initialInvestors);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [editingInvestor, setEditingInvestor] = useState<any>(null);
  const [supplierForm] = Form.useForm();
  const [investorForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('progress');

  // 图表配置
  const lineConfig = {
    data: progressData.weeklyProgress.map(item => ({
      week: item.week,
      value: item.completed,
      type: '已完成',
    })).concat(progressData.weeklyProgress.map(item => ({
      week: item.week,
      value: item.total - item.completed,
      type: '未完成',
    }))),
    xField: 'week',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: ['#10b981', '#f59e0b'],
    height: 200,
  };

  const pieConfig = {
    data: [
      { type: '已完成', value: progressData.metrics.completedTasks },
      { type: '待处理', value: progressData.metrics.pendingTasks },
      { type: '高优先级', value: progressData.metrics.highPriorityTasks },
    ],
    angleField: 'value',
    colorField: 'type',
    color: ['#10b981', '#f59e0b', '#ef4444'],
    radius: 0.8,
    height: 200,
    label: {
      type: 'inner',
      offset: '-30%',
      content: '{value}',
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
  };

  // 供应商表格列
  const supplierColumns = [
    { title: '供应商名称', dataIndex: 'name', key: 'name', render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '评分', dataIndex: 'rating', key: 'rating', render: (rating: number) => rating > 0 ? <span style={{ color: '#f59e0b' }}>★{rating}</span> : '-' },
    { title: '合作次数', dataIndex: 'cooperationCount', key: 'cooperationCount' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Badge status={status === '合作中' ? 'success' : status === '洽谈中' ? 'processing' : 'default'} text={status} />
    )},
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Tooltip title="编辑">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditSupplier(record)} />
        </Tooltip>
        <Tooltip title="删除">
          <Popconfirm title="确定删除此供应商？" onConfirm={() => handleDeleteSupplier(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Tooltip>
      </Space>
    )},
  ];

  // 投资商表格列
  const investorColumns = [
    { title: '投资商名称', dataIndex: 'name', key: 'name', render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span> },
    { title: '投资类型', dataIndex: 'type', key: 'type', render: (text: string) => <Tag color="purple">{text}</Tag> },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (text: string) => <span style={{ color: '#f59e0b', fontWeight: 600 }}>{text}</span> },
    { title: '股权', dataIndex: 'equity', key: 'equity' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Badge status={status === '已投资' || status === '已到账' ? 'success' : 'processing'} text={status} />
    )},
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Tooltip title="编辑">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditInvestor(record)} />
        </Tooltip>
        <Tooltip title="删除">
          <Popconfirm title="确定删除此投资商？" onConfirm={() => handleDeleteInvestor(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Tooltip>
      </Space>
    )},
  ];

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    supplierForm.resetFields();
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (record: any) => {
    setEditingSupplier(record);
    supplierForm.setFieldsValue(record);
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = (id: number) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
    notification.success({ message: '供应商已删除' });
  };

  const handleSupplierSubmit = (values: any) => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...values } : s));
      notification.success({ message: '供应商信息已更新' });
    } else {
      setSuppliers([...suppliers, { ...values, id: Date.now(), cooperationCount: 0, lastCooperation: '-', rating: 0 }]);
      notification.success({ message: '供应商已添加' });
    }
    setIsSupplierModalOpen(false);
  };

  const handleAddInvestor = () => {
    setEditingInvestor(null);
    investorForm.resetFields();
    setIsInvestorModalOpen(true);
  };

  const handleEditInvestor = (record: any) => {
    setEditingInvestor(record);
    investorForm.setFieldsValue(record);
    setIsInvestorModalOpen(true);
  };

  const handleDeleteInvestor = (id: number) => {
    setInvestors(investors.filter(i => i.id !== id));
    notification.success({ message: '投资商已删除' });
  };

  const handleInvestorSubmit = (values: any) => {
    if (editingInvestor) {
      setInvestors(investors.map(i => i.id === editingInvestor.id ? { ...i, ...values } : i));
      notification.success({ message: '投资商信息已更新' });
    } else {
      setInvestors([...investors, { ...values, id: Date.now() }]);
      notification.success({ message: '投资商已添加' });
    }
    setIsInvestorModalOpen(false);
  };

  const { Text } = require('antd').Typography;

  return (
    <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
          <DashboardOutlined style={{ marginRight: 8, color: '#a855f7' }} />
          创业数据面板
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>实时监控创业进度，管理合作伙伴关系</p>
      </div>

      {/* 通知栏 */}
      <div style={{ marginBottom: 16 }}>
        {notifications.slice(0, 2).map(item => (
          <div key={item.id} style={{ padding: '8px 0' }}>
            <Alert
              title={item.message}
              type={item.type as any}
              showIcon
              style={{ width: '100%', borderRadius: 8 }}
              action={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.time}</span>}
            />
          </div>
        ))}
      </div>

      {/* 顶部统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #a855f715 0%, #a855f705 100%)', border: '1px solid #a855f720' }}>
            <Statistic
              title="总体进度"
              value={progressData.overall}
              suffix="%"
              styles={{ content: { color: '#a855f7', fontSize: 28, fontWeight: 700 } }}
              prefix={<RiseOutlined />}
            />
            <Progress percent={progressData.overall} strokeColor="#a855f7" showInfo={false} size="small" />
            <div style={{ marginTop: 8, fontSize: 12, color: '#10b981' }}>
              <ArrowUpOutlined /> 较上周提升5%
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac20' }}>
            <Statistic
              title="已完成任务"
              value={progressData.metrics.completedTasks}
              suffix={`/ ${progressData.metrics.totalTasks}`}
              styles={{ content: { color: '#10b981', fontSize: 28, fontWeight: 700 } }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              完成率 {Math.round((progressData.metrics.completedTasks / progressData.metrics.totalTasks) * 100)}%
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: '#fef3c7', border: '1px solid #fcd34d20' }}>
            <Statistic
              title="合作伙伴"
              value={suppliers.length}
              styles={{ content: { color: '#f59e0b', fontSize: 28, fontWeight: 700 } }}
              prefix={<TeamOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              合作中 {suppliers.filter(s => s.status === '合作中').length} 家
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: '#eff6ff', border: '1px solid #93c5fd20' }}>
            <Statistic
              title="投资总额"
              value={investors.filter(i => i.status === '已投资' || i.status === '已到账').reduce((acc, curr) => acc + parseInt(curr.amount), 0)}
              suffix="万"
              styles={{ content: { color: '#3b82f6', fontSize: 28, fontWeight: 700 } }}
              prefix={<DollarOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              已到账 {investors.filter(i => i.status === '已到账').length} 笔
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        {/* 创业进度 */}
        <TabPane tab={<span><RiseOutlined /> 创业进度</span>} key="progress">
          <Row gutter={24}>
            <Col span={16}>
              <Card title="阶段进度" style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 16 }}>
                <Timeline
                  items={progressData.stages.map((stage) => ({
                    icon: stage.progress === 100 ? (
                      <CheckCircleOutlined style={{ color: '#10b981', fontSize: 16 }} />
                    ) : stage.progress > 0 ? (
                      <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d9d9d9' }} />
                    ),
                    color: stage.progress === 100 ? 'green' : stage.progress > 0 ? 'orange' : 'gray',
                    content: (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text strong>{stage.name}</Text>
                          <Space>
                            <Tag color={stage.progress === 100 ? 'success' : stage.progress > 0 ? 'processing' : 'default'}>
                              {stage.progress === 100 ? '已完成' : stage.progress > 0 ? '进行中' : '待开始'}
                            </Tag>
                            {stage.date !== '-' && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stage.date}</span>}
                          </Space>
                        </div>
                        <Progress percent={stage.progress} strokeColor={stage.progress === 100 ? '#10b981' : '#a855f7'} size="small" />
                      </div>
                    ),
                  }))}
                />
              </Card>
              <Card title="每周进度趋势" style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
                <Line {...lineConfig} />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="任务分布" style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 16 }}>
                <Pie {...pieConfig} />
              </Card>
              <Card title="快捷操作" style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <Button type="primary" block icon={<PlusOutlined />} onClick={() => setActiveTab('suppliers')} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
                    添加供应商
                  </Button>
                  <Button type="primary" block icon={<PlusOutlined />} onClick={() => setActiveTab('investors')} style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>
                    添加投资商
                  </Button>
                  <Button block icon={<SyncOutlined />} onClick={() => notification.info({ message: '数据已同步' })}>
                    同步数据
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 供应商管理 */}
        <TabPane tab={<span><TeamOutlined /> 供应商管理</span>} key="suppliers">
          <Card
            style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>供应商列表</span>
                <Space>
                  <Tag color="success">合作中 {suppliers.filter(s => s.status === '合作中').length}</Tag>
                  <Tag color="processing">洽谈中 {suppliers.filter(s => s.status === '洽谈中').length}</Tag>
                </Space>
              </div>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSupplier} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
                添加供应商
              </Button>
            }
          >
            <Table dataSource={suppliers} columns={supplierColumns} rowKey="id" pagination={{ pageSize: 5 }} />
          </Card>
        </TabPane>

        {/* 投资商合作 */}
        <TabPane tab={<span><DollarOutlined /> 投资商合作</span>} key="investors">
          <Card
            style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>投资商列表</span>
                <Space>
                  <Tag color="success">已投资 {investors.filter(i => i.status === '已投资' || i.status === '已到账').length}</Tag>
                  <Tag color="processing">洽谈中 {investors.filter(i => i.status === '洽谈中').length}</Tag>
                </Space>
              </div>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddInvestor} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
                添加投资商
              </Button>
            }
          >
            <Table dataSource={investors} columns={investorColumns} rowKey="id" pagination={{ pageSize: 5 }} />
          </Card>
        </TabPane>
      </Tabs>

      {/* 供应商弹窗 */}
      <Modal
        title={editingSupplier ? '编辑供应商' : '添加供应商'}
        open={isSupplierModalOpen}
        onCancel={() => setIsSupplierModalOpen(false)}
        onOk={() => supplierForm.submit()}
      >
        <Form form={supplierForm} onFinish={handleSupplierSubmit} layout="vertical">
          <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}>
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select placeholder="选择类型">
              <Option value="技术">技术</Option>
              <Option value="设计">设计</Option>
              <Option value="营销">营销</Option>
              <Option value="法务">法务</Option>
              <Option value="财务">财务</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="contact" label="联系人" rules={[{ required: true }]}>
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select placeholder="选择状态">
              <Option value="合作中">合作中</Option>
              <Option value="洽谈中">洽谈中</Option>
              <Option value="已终止">已终止</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 投资商弹窗 */}
      <Modal
        title={editingInvestor ? '编辑投资商' : '添加投资商'}
        open={isInvestorModalOpen}
        onCancel={() => setIsInvestorModalOpen(false)}
        onOk={() => investorForm.submit()}
      >
        <Form form={investorForm} onFinish={handleInvestorSubmit} layout="vertical">
          <Form.Item name="name" label="投资商名称" rules={[{ required: true }]}>
            <Input placeholder="请输入投资商名称" />
          </Form.Item>
          <Form.Item name="type" label="投资类型" rules={[{ required: true }]}>
            <Select placeholder="选择投资类型">
              <Option value="天使轮">天使轮</Option>
              <Option value="Pre-A轮">Pre-A轮</Option>
              <Option value="A轮">A轮</Option>
              <Option value="B轮">B轮</Option>
              <Option value="补贴">补贴</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <Input placeholder="例如：50万" />
          </Form.Item>
          <Form.Item name="equity" label="股权" rules={[{ required: true }]}>
            <Input placeholder="例如：10%" />
          </Form.Item>
          <Form.Item name="contact" label="联系人" rules={[{ required: true }]}>
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select placeholder="选择状态">
              <Option value="洽谈中">洽谈中</Option>
              <Option value="已投资">已投资</Option>
              <Option value="已到账">已到账</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataDashboard;
