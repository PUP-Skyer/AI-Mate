/**
 * 用量统计页面
 * 展示各模型 Token 消耗汇总、今日用量与明细记录
 * 参考 EvoFlow 的用量监控能力
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  Progress,
  List,
  Tag,
  Space,
  Button,
  Empty,
  Popconfirm,
  Table,
  message,
} from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  BarChartOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import {
  fetchUsageSummary,
  fetchUsageRecords,
  resetUsage,
  formatTokens,
  estimateCost,
  type UsageSummary,
  type UsageRecord,
} from '../services/usageService';
import { useI18n } from '../i18n';

const { Title, Text } = Typography;

const UsageStats: React.FC = () => {
  const { t, lang } = useI18n();
  const [summary, setSummary] = useState<UsageSummary>({
    byModel: [],
    total: { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    today: { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  });
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, r] = await Promise.all([fetchUsageSummary(), fetchUsageRecords(50)]);
    setSummary(s);
    setRecords(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReset = async () => {
    const ok = await resetUsage();
    if (ok) {
      message.success(t('usage.resetSuccess'));
      load();
    } else {
      message.error(t('usage.resetFailed'));
    }
  };

  // 总量占比（用于 Progress 展示）
  const maxTokens = Math.max(1, ...summary.byModel.map((m) => m.total_tokens));

  const columns = [
    {
      title: t('usage.colModel'),
      dataIndex: 'modelId',
      key: 'modelId',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: t('usage.colCalls'),
      dataIndex: 'calls',
      key: 'calls',
      render: (v: number) => formatTokens(v),
    },
    {
      title: t('usage.colInput'),
      dataIndex: 'prompt_tokens',
      key: 'prompt_tokens',
      render: (v: number) => formatTokens(v),
    },
    {
      title: t('usage.colOutput'),
      dataIndex: 'completion_tokens',
      key: 'completion_tokens',
      render: (v: number) => formatTokens(v),
    },
    {
      title: t('usage.colTotal'),
      dataIndex: 'total_tokens',
      key: 'total_tokens',
      render: (v: number) => <Text strong style={{ color: '#1677ff' }}>{formatTokens(v)}</Text>,
    },
    {
      title: t('usage.colLastUsed'),
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (v: number) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(v).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN')}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            {t('usage.title')}
          </Title>
          <Text type="secondary">{t('usage.subtitle')}</Text>
        </div>
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={load} loading={loading}>
            {t('common.refresh')}
          </Button>
          <Popconfirm title={t('usage.resetConfirm')} onConfirm={handleReset}>
            <Button icon={<DeleteOutlined />} danger>
              {t('common.reset')}
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 汇总卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('usage.totalCalls')}
              value={summary.total.calls}
              suffix={t('usage.times')}
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('usage.totalTokens')}
              value={summary.total.total_tokens}
              prefix={<DatabaseOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('usage.todayCalls')}
              value={summary.today.calls}
              suffix={t('usage.times')}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('usage.todayTokens')}
              value={summary.today.total_tokens}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 按模型分布 */}
      <Card size="small" title={t('usage.byModelTitle')} style={{ marginBottom: 16 }}>
        {summary.byModel.length === 0 ? (
          <Empty description={t('usage.emptyRecord')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div>
            {summary.byModel.map((m) => (
              <div key={m.modelId} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Space>
                    <Tag color="blue">{m.modelId}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('usage.callsCount', { count: m.calls })}</Text>
                  </Space>
                  <Text strong style={{ fontSize: 13 }}>
                    {formatTokens(m.total_tokens)} tokens
                  </Text>
                </div>
                <Progress
                  percent={Math.round((m.total_tokens / maxTokens) * 100)}
                  showInfo={false}
                  strokeColor={{ from: '#108ee9', to: '#87d068' }}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 用量明细 */}
      <Card size="small" title={t('usage.recentDetail')}>
        <Table
          size="small"
          loading={loading}
          columns={columns}
          dataSource={summary.byModel}
          rowKey="modelId"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: t('usage.emptyTable') }}
        />
        {records.length > 0 && (
          <List
            size="small"
            header={<Text strong style={{ fontSize: 12 }}>{t('usage.recentRecords', { count: records.length })}</Text>}
            dataSource={records}
            renderItem={(r) => (
              <List.Item>
                <Space>
                  <Tag color="geekblue" style={{ fontSize: 11 }}>{r.modelId}</Tag>
                  <Text style={{ fontSize: 12 }}>in {formatTokens(r.prompt_tokens)}</Text>
                  <Text style={{ fontSize: 12 }}>out {formatTokens(r.completion_tokens)}</Text>
                  <Text strong style={{ fontSize: 12, color: '#1677ff' }}>{formatTokens(r.total_tokens)}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t('usage.estimateCost', { cost: estimateCost(r).toFixed(4) })}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(r.createdAt).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN')}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default UsageStats;
