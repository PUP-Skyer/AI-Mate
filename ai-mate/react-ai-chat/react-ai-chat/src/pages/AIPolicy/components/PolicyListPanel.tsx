/**
 * AI 创业政策列表面板
 * KPI 条 + 筛选栏 + 密集表格 + 底部链接区块
 */
import React, { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Space, Typography, Empty, Tooltip, Spin } from 'antd';
import { SearchOutlined, LinkOutlined, GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { POLICY_STATS, SUPPORT_LINKS, OFFICIAL_SITES } from '../data';
import { POLICY_LEVEL_COLORS } from '../types';
import type { AIPolicy, PolicyLevel, PolicyStatus } from '../types';

const { Text } = Typography;

interface Props {
  policies: AIPolicy[];
  loading: boolean;
  onOpen: (policy: AIPolicy) => void;
}

const STATUS_COLORS: Record<PolicyStatus, string> = {
  进行中: 'green',
  即将截止: 'orange',
  已结束: 'default',
};

const PolicyListPanel: React.FC<Props> = ({ policies, loading, onOpen }) => {
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let list = policies;
    if (level !== 'all') list = list.filter((p) => p.level === level);
    if (status !== 'all') list = list.filter((p) => p.status === status);
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.department.toLowerCase().includes(kw) ||
          p.keywords.some((k) => k.toLowerCase().includes(kw))
      );
    }
    return list;
  }, [policies, keyword, level, status]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 116,
      render: (v: string) => <Text style={{ fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{v}</Text> },
    { title: '政策标题', dataIndex: 'title', key: 'title',
      render: (v: string) => (
        <Tooltip title={v}>
          <Text strong style={{ fontSize: 13, color: '#111827' }}>
            {v.length > 30 ? `${v.slice(0, 30)}…` : v}
          </Text>
        </Tooltip>
      ) },
    { title: '级别', dataIndex: 'level', key: 'level', width: 88,
      render: (v: PolicyLevel) => (
        <Tag style={{ borderRadius: 4, marginInlineEnd: 0 }} color={POLICY_LEVEL_COLORS[v] || 'default'}>{v}</Tag>
      ) },
    { title: '发布单位', dataIndex: 'department', key: 'department', width: 150, ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 12, color: '#374151' }}>{v}</Text> },
    { title: '时间戳', dataIndex: 'publishedAt', key: 'publishedAt', width: 100,
      render: (v: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ fontSize: 11, color: '#9ca3af' }} />
          <Text style={{ fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{v}</Text>
        </Space>
      ) },
    { title: '状态', dataIndex: 'status', key: 'status', width: 88,
      render: (v: PolicyStatus) => <Tag color={STATUS_COLORS[v]} style={{ borderRadius: 4, marginInlineEnd: 0 }}>{v}</Tag> },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', width: 100,
      render: (v?: string) => (
        <Text style={{ fontSize: 12, color: v ? '#b45309' : '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>{v || '长期'}</Text>
      ) },
  ];

  const renderLinkBlocks = (
    id: string,
    title: string,
    icon: React.ReactNode,
    data: { id: string; label: string; source: string; url: string }[]
  ) => (
    <div id={id} className="ap-link-card">
      <div className="ap-section-heading">
        <span className="ap-seq">{icon}</span>
        {title}
      </div>
      <div className="ap-link-grid">
        {data.map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="ap-link-item">
            <Text strong style={{ fontSize: 13, color: '#1e40af' }}>{item.label}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 12, flexShrink: 0 }}>{item.source}</Text>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ap-enter">
      {/* KPI 条 */}
      <div className="ap-kpi-row">
        <div className="ap-kpi-item">
          <div className="ap-kpi-label">政策总数量</div>
          <div className="ap-kpi-value">{POLICY_STATS.total}</div>
          <span className="ap-kpi-delta">↑ 12.3% 较上月</span>
        </div>
        <div className="ap-kpi-item">
          <div className="ap-kpi-label">本周新增</div>
          <div className="ap-kpi-value ap-amber">+{POLICY_STATS.weeklyNew}</div>
        </div>
        <div className="ap-kpi-item">
          <div className="ap-kpi-label">申报中</div>
          <div className="ap-kpi-value">{POLICY_STATS.activeCount}</div>
        </div>
        <div className="ap-kpi-item">
          <div className="ap-kpi-label">覆盖单位</div>
          <div className="ap-kpi-value">{POLICY_STATS.orgCount}</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="ap-filter-bar">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          placeholder="搜索标题 / 单位 / 关键词"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          style={{ width: 240 }}
        />
        <Select
          value={level}
          onChange={(v) => { setLevel(v); setPage(1); }}
          style={{ width: 130 }}
          options={[
            { label: '全部级别', value: 'all' },
            { label: '国家级', value: '国家级' },
            { label: '省部级', value: '省部级' },
            { label: '地市级', value: '地市级' },
            { label: '行业规范', value: '行业规范' },
          ]}
        />
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          style={{ width: 130 }}
          options={[
            { label: '全部状态', value: 'all' },
            { label: '进行中', value: '进行中' },
            { label: '即将截止', value: '即将截止' },
            { label: '已结束', value: '已结束' },
          ]}
        />
        <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>共 {filtered.length} 条</Text>
      </div>

      {/* 密集表格 */}
      <div className="ap-table-card">
        <Table<AIPolicy>
          rowKey="id"
          size="small"
          loading={loading && { indicator: <Spin size="small" /> }}
          columns={columns}
          dataSource={paged}
          pagination={{
            current: page, pageSize, total: filtered.length,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条政策`,
            onChange: (p) => setPage(p),
          }}
          locale={{ emptyText: <Empty description="没有符合条件的政策" /> }}
          onRow={(r) => ({
            onClick: () => onOpen(r),
            onMouseEnter: () => setHoverId(r.id),
            onMouseLeave: () => setHoverId(null),
          })}
          rowClassName={(r) => (hoverId === r.id ? 'ap-row-hover' : '')}
        />
      </div>

      {/* 底部链接区块（3D 卡片入口滚动目标） */}
      {renderLinkBlocks('ai-policy-support', '扶持政策链接', <LinkOutlined />, SUPPORT_LINKS)}
      {renderLinkBlocks('ai-policy-official', '单位官网', <GlobalOutlined />, OFFICIAL_SITES)}
    </div>
  );
};

export default PolicyListPanel;
