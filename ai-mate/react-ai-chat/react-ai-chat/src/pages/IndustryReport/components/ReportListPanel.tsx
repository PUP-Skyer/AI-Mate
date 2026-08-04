/**
 * 行业报告列表面板
 * KPI 条 + 筛选栏 + 密集表格 + 分页
 */
import React, { useMemo, useState } from 'react';
import { Table, Tag, Input, Select, Button, Tooltip, Space, Typography, Empty } from 'antd';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
} from '@ant-design/icons';
import { REPORT_STATS, CATEGORY_LIST } from '../data';
import type { IndustryReport, ReportCategory } from '../types';

const { Text } = Typography;

interface Props {
  reports: IndustryReport[];
  favorites: Set<string>;
  onOpen: (report: IndustryReport) => void;
  onToggleFavorite: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  人工智能: '#1677ff',
  新能源: '#52c41a',
  智慧餐饮: '#fa8c16',
  智能制造: '#722ed1',
  生物医药: '#eb2f96',
  金融科技: '#13c2c2',
  跨境电商: '#faad14',
};

const ReportListPanel: React.FC<Props> = ({ reports, favorites, onOpen, onToggleFavorite }) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [page, setPage] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let list = reports;
    if (category !== 'all') {
      list = list.filter((r) => r.category === category);
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(kw) ||
          r.institution.toLowerCase().includes(kw) ||
          r.keywords.some((k) => k.toLowerCase().includes(kw))
      );
    }
    if (onlyFavorite) {
      list = list.filter((r) => favorites.has(r.id));
    }
    return list;
  }, [reports, keyword, category, onlyFavorite, favorites]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    {
      title: '报告编号',
      dataIndex: 'id',
      key: 'id',
      width: 118,
      render: (v: string) => (
        <Text style={{ fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{v}</Text>
      ),
    },
    {
      title: '报告标题',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, r: IndustryReport) => (
        <Space size={6}>
          <StarFilled
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(r.id);
            }}
            style={{
              color: favorites.has(r.id) ? '#f59e0b' : '#d1d5db',
              cursor: 'pointer',
              fontSize: 14,
            }}
          />
          <Tooltip title={v}>
            <Text strong style={{ fontSize: 13, color: '#111827', cursor: 'pointer' }}>
              {v.length > 34 ? `${v.slice(0, 34)}…` : v}
            </Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 96,
      render: (v: ReportCategory) => (
        <Tag style={{ borderRadius: 4, marginInlineEnd: 0 }} color={CATEGORY_COLORS[v] || 'default'}>
          {v}
        </Tag>
      ),
    },
    {
      title: '机构',
      dataIndex: 'institution',
      key: 'institution',
      width: 140,
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 12, color: '#374151' }}>{v}</Text>,
    },
    {
      title: '发布日期',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 96,
      render: (v: string) => (
        <Text style={{ fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{v}</Text>
      ),
    },
    {
      title: '阅读量',
      dataIndex: 'readCount',
      key: 'readCount',
      width: 92,
      sorter: (a: IndustryReport, b: IndustryReport) => a.readCount - b.readCount,
      render: (v: number) => (
        <Space size={4}>
          <EyeOutlined style={{ fontSize: 11, color: '#9ca3af' }} />
          <Text style={{ fontSize: 12, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
            {v.toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: '热度',
      dataIndex: 'heatIndex',
      key: 'heatIndex',
      width: 150,
      sorter: (a: IndustryReport, b: IndustryReport) => a.heatIndex - b.heatIndex,
      render: (v: number) => (
        <div className="ir-heat">
          <div className="ir-heat-track">
            <div className="ir-heat-fill" style={{ width: `${v}%` }} />
          </div>
          <span className="ir-heat-num">{v}</span>
        </div>
      ),
    },
    {
      title: '页数',
      dataIndex: 'pageCount',
      key: 'pageCount',
      width: 64,
      align: 'right' as const,
      render: (v: number) => (
        <Text style={{ fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{v}</Text>
      ),
    },
  ];

  return (
    <div className="ir-enter">
      {/* KPI 条 */}
      <div className="ir-kpi-row">
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">报告总数量</div>
          <div className="ir-kpi-value">{REPORT_STATS.total.toLocaleString()}</div>
          <span className="ir-kpi-delta">↑ 23.5% 较上月</span>
        </div>
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">本周新增</div>
          <div className="ir-kpi-value ir-amber">+{REPORT_STATS.weeklyNew}</div>
        </div>
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">日均更新</div>
          <div className="ir-kpi-value">{REPORT_STATS.dailyAvg}</div>
        </div>
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">覆盖机构</div>
          <div className="ir-kpi-value">{REPORT_STATS.institutionCount.toLocaleString()}</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="ir-filter-bar">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          placeholder="搜索标题 / 机构 / 关键词"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={{ width: 240 }}
        />
        <Select
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
          style={{ width: 130 }}
          options={[
            { label: '全部分类', value: 'all' },
            ...CATEGORY_LIST.map((c) => ({ label: `${c.name} (${c.count.toLocaleString()})`, value: c.name })),
          ]}
        />
        <Button
          icon={onlyFavorite ? <StarFilled /> : <StarOutlined />}
          onClick={() => {
            setOnlyFavorite((v) => !v);
            setPage(1);
          }}
          type={onlyFavorite ? 'primary' : 'default'}
          size="middle"
        >
          只看收藏 {favorites.size > 0 ? `(${favorites.size})` : ''}
        </Button>
        <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>
          共 {filtered.length} 条
        </Text>
      </div>

      {/* 密集表格 */}
      <div className="ir-table-card">
        <Table<IndustryReport>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={paged}
          pagination={{
            current: page,
            pageSize,
            total: filtered.length,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条报告`,
            onChange: (p) => setPage(p),
          }}
          locale={{ emptyText: <Empty description="没有符合条件的报告" /> }}
          onRow={(r) => ({
            onClick: () => onOpen(r),
            onMouseEnter: () => setHoverId(r.id),
            onMouseLeave: () => setHoverId(null),
          })}
          rowClassName={(r) => (hoverId === r.id ? 'ir-row-hover' : '')}
        />
      </div>
    </div>
  );
};

export default ReportListPanel;
