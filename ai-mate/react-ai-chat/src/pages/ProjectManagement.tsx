import React, { useState } from 'react';
import { Avatar, Badge, Tag, Progress, Table, Button, Modal, Form, Input, Select, App } from 'antd';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  team: string;
  industry: string;
  stage: string;
  funding: number;
  valuation: number;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  createTime: string;
  description: string;
  contact: string;
  email: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: '智创未来',
    team: '智创科技团队',
    industry: '人工智能',
    stage: 'A轮',
    funding: 2500,
    valuation: 12000,
    status: 'approved',
    createTime: '2024-03-15',
    description: '基于大语言模型的企业级智能助手平台',
    contact: '张经理',
    email: 'zhang@zhichuang.com',
  },
  {
    id: '2',
    name: '绿能动力',
    team: '绿能创新实验室',
    industry: '新能源',
    stage: 'Pre-A轮',
    funding: 1200,
    valuation: 6000,
    status: 'reviewing',
    createTime: '2025-01-20',
    description: '新一代固态电池技术研发',
    contact: '李博士',
    email: 'li@lvneng.com',
  },
  {
    id: '3',
    name: '医智云',
    team: '医智科技',
    industry: '智慧医疗',
    stage: 'B轮',
    funding: 5000,
    valuation: 35000,
    status: 'approved',
    createTime: '2023-06-10',
    description: 'AI辅助诊断平台',
    contact: '王主任',
    email: 'wang@yizhi.com',
  },
  {
    id: '4',
    name: '数联云科',
    team: '数联团队',
    industry: '企业服务',
    stage: '天使轮',
    funding: 500,
    valuation: 2500,
    status: 'pending',
    createTime: '2025-04-08',
    description: '企业数字化转型解决方案',
    contact: '陈总',
    email: 'chen@shulian.com',
  },
  {
    id: '5',
    name: '教育新篇',
    team: '教育创新实验室',
    industry: '在线教育',
    stage: '种子轮',
    funding: 200,
    valuation: 1000,
    status: 'rejected',
    createTime: '2025-02-28',
    description: 'AI个性化学习平台',
    contact: '刘老师',
    email: 'liu@jiaoyu.com',
  },
];

const statusConfig: Record<string, { label: string; color: string; badge: string }> = {
  pending: { label: '待审核', color: '#F59E0B', badge: 'processing' },
  reviewing: { label: '审核中', color: '#3B82F6', badge: 'processing' },
  approved: { label: '已通过', color: '#10B981', badge: 'success' },
  rejected: { label: '已驳回', color: '#EF4444', badge: 'error' },
};

const stageOptions = ['种子轮', '天使轮', 'Pre-A轮', 'A轮', 'B轮', 'C轮'];
const industryOptions = ['人工智能', '新能源', '智慧医疗', '企业服务', '在线教育', '金融科技', '智能制造'];

const ProjectManagementContent: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue(project);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        message.success('删除成功');
      },
    });
  };

  const handleSubmit = (values: any) => {
    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, ...values } : p))
      );
      message.success('更新成功');
    } else {
      const newProject: Project = {
        id: `${Date.now()}`,
        ...values,
        createTime: new Date().toISOString().split('T')[0],
      };
      setProjects((prev) => [newProject, ...prev]);
      message.success('创建成功');
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: '项目',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={36}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {text[0]}
          </Avatar>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{text}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{record.team}</div>
          </div>
        </div>
      ),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      render: (text: string) => (
        <Tag style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: '#60A5FA' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (text: string) => (
        <span style={{ fontSize: 13, color: '#CBD5E1' }}>{text}</span>
      ),
    },
    {
      title: '融资额',
      dataIndex: 'funding',
      key: 'funding',
      render: (val: number) => (
        <span style={{ fontSize: 14, fontWeight: 600, color: '#10B981' }}>¥{val}万</span>
      ),
    },
    {
      title: '估值',
      dataIndex: 'valuation',
      key: 'valuation',
      render: (val: number) => (
        <span style={{ fontSize: 13, color: '#94A3B8' }}>¥{val}万</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status];
        return (
          <Badge
            status={config.badge as any}
            text={<span style={{ color: config.color, fontSize: 13 }}>{config.label}</span>}
          />
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (text: string) => (
        <span style={{ fontSize: 12, color: '#64748B' }}>{text}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleEdit(record)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-light)',
              background: 'rgba(255,255,255,0.03)',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit3 size={13} /> 编辑
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.05)',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Trash2 size={13} /> 删除
          </button>
        </div>
      ),
    },
  ];

  const stats = [
    { label: '项目总数', value: projects.length, color: '#3B82F6', icon: FolderKanban },
    { label: '已通过', value: projects.filter((p) => p.status === 'approved').length, color: '#10B981', icon: CheckCircle2 },
    { label: '审核中', value: projects.filter((p) => p.status === 'reviewing').length, color: '#F59E0B', icon: Clock },
    { label: '总融资额', value: `¥${projects.reduce((sum, p) => sum + p.funding, 0)}万`, color: '#8B5CF6', icon: TrendingUp },
  ];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-heading)' }}>
          项目管理
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#94A3B8' }}>管理平台所有项目，审核项目状态，维护项目信息</p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              style={{
                padding: 20,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} color={stat.color} />
                </div>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* 操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={handleAdd}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          <Plus size={16} /> 新增项目
        </button>
      </div>

      {/* 项目表格 */}
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={projects}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ background: 'transparent' }}
        />
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingProject ? '保存' : '创建'}
        cancelText="取消"
        width={600}
        styles={{
          content: { background: '#1E293B', borderRadius: 16 },
          header: { background: '#1E293B', color: '#E2E8F0' },
          body: { background: '#1E293B' },
          footer: { background: '#1E293B' },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label={<span style={{ color: '#CBD5E1' }}>项目名称</span>}
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-light)', color: '#E2E8F0' }} />
          </Form.Item>
          <Form.Item
            name="team"
            label={<span style={{ color: '#CBD5E1' }}>团队名称</span>}
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="请输入团队名称" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-light)', color: '#E2E8F0' }} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="industry"
              label={<span style={{ color: '#CBD5E1' }}>所属行业</span>}
              rules={[{ required: true, message: '请选择行业' }]}
            >
              <Select
                placeholder="请选择行业"
                options={industryOptions.map((o) => ({ label: o, value: o }))}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </Form.Item>
            <Form.Item
              name="stage"
              label={<span style={{ color: '#CBD5E1' }}>融资阶段</span>}
              rules={[{ required: true, message: '请选择阶段' }]}
            >
              <Select
                placeholder="请选择阶段"
                options={stageOptions.map((o) => ({ label: o, value: o }))}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="funding"
              label={<span style={{ color: '#CBD5E1' }}>融资额（万）</span>}
              rules={[{ required: true, message: '请输入融资额' }]}
            >
              <Input type="number" placeholder="请输入融资额" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-light)', color: '#E2E8F0' }} />
            </Form.Item>
            <Form.Item
              name="valuation"
              label={<span style={{ color: '#CBD5E1' }}>估值（万）</span>}
              rules={[{ required: true, message: '请输入估值' }]}
            >
              <Input type="number" placeholder="请输入估值" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-light)', color: '#E2E8F0' }} />
            </Form.Item>
          </div>
          <Form.Item
            name="status"
            label={<span style={{ color: '#CBD5E1' }}>项目状态</span>}
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择状态"
              options={[
                { label: '待审核', value: 'pending' },
                { label: '审核中', value: 'reviewing' },
                { label: '已通过', value: 'approved' },
                { label: '已驳回', value: 'rejected' },
              ]}
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={<span style={{ color: '#CBD5E1' }}>项目描述</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入项目描述"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-light)', color: '#E2E8F0' }}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="contact"
              label={<span style={{ color: '#CBD5E1' }}>联系人</span>}
            >
              <Input placeholder="请输入联系人" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-light)', color: '#E2E8F0' }} />
            </Form.Item>
            <Form.Item
              name="email"
              label={<span style={{ color: '#CBD5E1' }}>联系邮箱</span>}
            >
              <Input placeholder="请输入联系邮箱" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-light)', color: '#E2E8F0' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

const ProjectManagement: React.FC = () => (
  <App>
    <ProjectManagementContent />
  </App>
);

export default ProjectManagement;
