/**
 * 平台资源页面
 */

import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, Tabs, Badge, Statistic, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, DatabaseOutlined, ToolOutlined, StarOutlined, DownloadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

// 模拟资源数据
const resourceData = [
  {
    key: '1',
    name: '供应商数据库',
    type: '数据库',
    category: '供应链',
    size: '10,000+',
    updateTime: '2026-04-20',
    status: 'active',
    rating: 4.8,
    downloads: 1250,
  },
  {
    key: '2',
    name: '投资机构列表',
    type: '列表',
    category: '投资',
    size: '500+',
    updateTime: '2026-04-18',
    status: 'active',
    rating: 4.5,
    downloads: 890,
  },
  {
    key: '3',
    name: '行业报告库',
    type: '文档',
    category: '研究',
    size: '200+',
    updateTime: '2026-04-15',
    status: 'active',
    rating: 4.9,
    downloads: 2100,
  },
  {
    key: '4',
    name: '技术合作伙伴',
    type: '网络',
    category: '技术',
    size: '300+',
    updateTime: '2026-04-10',
    status: 'active',
    rating: 4.6,
    downloads: 650,
  },
  {
    key: '5',
    name: '营销渠道资源',
    type: '网络',
    category: '营销',
    size: '200+',
    updateTime: '2026-04-05',
    status: 'active',
    rating: 4.3,
    downloads: 980,
  },
];

// 模拟工具数据
const toolData = [
  {
    key: '1',
    name: '市场分析工具',
    type: '分析',
    category: '市场',
    version: 'v2.1',
    updateTime: '2026-04-22',
    status: 'active',
    rating: 4.7,
    users: 3200,
  },
  {
    key: '2',
    name: '竞争对手分析器',
    type: '分析',
    category: '竞争',
    version: 'v1.8',
    updateTime: '2026-04-19',
    status: 'active',
    rating: 4.4,
    users: 1800,
  },
  {
    key: '3',
    name: '投资回报率计算器',
    type: '计算',
    category: '财务',
    version: 'v1.5',
    updateTime: '2026-04-12',
    status: 'active',
    rating: 4.8,
    users: 2500,
  },
  {
    key: '4',
    name: '风险评估工具',
    type: '分析',
    category: '风险',
    version: 'v2.0',
    updateTime: '2026-04-08',
    status: 'active',
    rating: 4.5,
    users: 1500,
  },
];

// 模拟模板数据
const templateData = [
  {
    key: '1',
    name: '商业计划书模板',
    type: '文档模板',
    category: '创业',
    format: 'PPT/PDF',
    updateTime: '2026-04-20',
    status: 'active',
    rating: 4.9,
    downloads: 3500,
  },
  {
    key: '2',
    name: '财务预测模型',
    type: 'Excel模板',
    category: '财务',
    format: 'Excel',
    updateTime: '2026-04-15',
    status: 'active',
    rating: 4.7,
    downloads: 2100,
  },
  {
    key: '3',
    name: '用户调研问卷',
    type: '问卷模板',
    category: '调研',
    format: 'Word/PDF',
    updateTime: '2026-04-10',
    status: 'active',
    rating: 4.5,
    downloads: 1800,
  },
];

const ResourcePlatform: React.FC = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('');

  const resourcesColumns = [
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '规模',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>{rating}</span>
        </Space>
      ),
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      key: 'downloads',
      render: (downloads: number) => (
        <Space>
          <DownloadOutlined />
          <span>{downloads}</span>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '可用' : '不可用'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small" type="primary">查看</Button>
          <Button size="small">下载</Button>
        </Space>
      ),
    },
  ];

  const toolsColumns = [
    {
      title: '工具名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>{rating}</span>
        </Space>
      ),
    },
    {
      title: '用户数',
      dataIndex: 'users',
      key: 'users',
      render: (users: number) => users.toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '可用' : '不可用'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small" type="primary">使用</Button>
          <Button size="small">详情</Button>
        </Space>
      ),
    },
  ];

  const templateColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>{rating}</span>
        </Space>
      ),
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      key: 'downloads',
      render: (downloads: number) => (
        <Space>
          <DownloadOutlined />
          <span>{downloads}</span>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '可用' : '不可用'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small" type="primary">下载</Button>
          <Button size="small">预览</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      padding: '24px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
      minHeight: '100vh',
    }}>
      {/* 页面标题 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        background: '#fff',
        padding: '20px 24px',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1a1a2e' }}>平台资源</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            发现和使用平台提供的各类优质资源
          </p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          style={{ 
            borderRadius: 8,
            padding: '0 24px',
            height: 40,
          }}
        >
          添加资源
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <DatabaseOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>资源总数</span>}
              value={resourceData.length}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <ToolOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>工具总数</span>}
              value={toolData.length}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <StarOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>模板总数</span>}
              value={templateData.length}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <DownloadOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>总下载量</span>}
              value={resourceData.reduce((sum, r) => sum + r.downloads, 0)}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card 
        style={{ 
          marginBottom: 24,
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: '20px' } }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Input
            placeholder="搜索资源名称..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ 
              flex: 1,
              maxWidth: 400,
              height: 40,
              borderRadius: 8,
            }}
            size="large"
          />
          <Select
            placeholder="按分类筛选"
            value={category}
            onChange={(value) => setCategory(value)}
            style={{ width: 180, height: 40 }}
            size="large"
          >
            <Select.Option value="">全部分类</Select.Option>
            <Select.Option value="供应链">供应链</Select.Option>
            <Select.Option value="投资">投资</Select.Option>
            <Select.Option value="研究">研究</Select.Option>
            <Select.Option value="技术">技术</Select.Option>
            <Select.Option value="营销">营销</Select.Option>
          </Select>
          <Button 
            icon={<FilterOutlined />} 
            size="large"
            style={{ 
              height: 40,
              borderRadius: 8,
              padding: '0 20px',
            }}
          >
            高级筛选
          </Button>
        </div>
      </Card>

      {/* Tab页签 */}
      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'resources',
              label: (
                <span>
                  <DatabaseOutlined /> 资源库
                </span>
              ),
              children: (
                <Table
                  columns={resourcesColumns}
                  dataSource={resourceData}
                  pagination={{ 
                    pageSize: 10,
                    style: { marginTop: 16 },
                  }}
                  style={{ background: '#fff', borderRadius: 8 }}
                />
              ),
            },
            {
              key: 'tools',
              label: (
                <span>
                  <ToolOutlined /> 工具库
                </span>
              ),
              children: (
                <Table
                  columns={toolsColumns}
                  dataSource={toolData}
                  pagination={{ 
                    pageSize: 10,
                    style: { marginTop: 16 },
                  }}
                  style={{ background: '#fff', borderRadius: 8 }}
                />
              ),
            },
            {
              key: 'templates',
              label: (
                <span>
                  <StarOutlined /> 模板库
                </span>
              ),
              children: (
                <Table
                  columns={templateColumns}
                  dataSource={templateData}
                  pagination={{ 
                    pageSize: 10,
                    style: { marginTop: 16 },
                  }}
                  style={{ background: '#fff', borderRadius: 8 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ResourcePlatform;
