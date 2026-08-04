/**
 * 行业详情面板：ECharts 趋势图 + 指标 KPI + 报告列表 + 数据来源
 */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Button, Space, Tag, Typography, Tooltip } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { IndustryDatum } from '../types';

const { Text } = Typography;

interface Props {
  industry: IndustryDatum;
  lastUpdated: string;
  source: 'fetched' | 'mock';
  onBack: () => void;
}

const IndustryDetailPanel: React.FC<Props> = ({ industry, lastUpdated, source, onBack }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !industry.charts?.length) return;
    const chart = echarts.init(chartRef.current);
    const c = industry.charts[0];
    chart.setOption({
      tooltip: { trigger: 'axis', textStyle: { fontSize: 10 } },
      grid: { top: 24, right: 16, bottom: 24, left: 48 },
      xAxis: { type: 'category', data: Object.keys(industry.dataPoints) },
      yAxis: { type: 'value' },
      series: [{
        name: c.series[0]?.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        data: c.series[0]?.values,
        lineStyle: { color: industry.color, width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: `${industry.color}33` }, { offset: 1, color: `${industry.color}00` }] } },
      }],
    });
    return () => chart.dispose();
  }, [industry]);

  return (
    <div className="id-enter">
      <Space style={{ marginBottom: 10 }} wrap>
        <Button icon={<ArrowLeftOutlined />} size="small" onClick={onBack}>返回行业总览</Button>
        <Text strong style={{ fontSize: 16, color: industry.color }}>{industry.industry}</Text>
        <Tag color={source === 'fetched' ? 'green' : 'orange'}>{source === 'fetched' ? '实时抓取' : '基准数据'}</Tag>
        <Text type="secondary" style={{ fontSize: 11 }}>最后更新 {new Date(lastUpdated).toLocaleString('zh-CN')}</Text>
      </Space>

      {/* 数据图 */}
      <div className="id-chart-card">
        <Text strong style={{ fontSize: 13 }}>{industry.charts?.[0]?.title || '市场规模趋势'}</Text>
        <div ref={chartRef} style={{ width: '100%', height: 260, marginTop: 8 }} />
      </div>

      {/* 指标 KPI */}
      <div className="id-kpi-row">
        <div className="id-kpi-item"><div className="id-kpi-label">市场规模</div><div className="id-kpi-value">{industry.marketSize}</div></div>
        <div className="id-kpi-item"><div className="id-kpi-label">同比增长</div><div className="id-kpi-value id-green">↑ {industry.growthRate}%</div></div>
        <div className="id-kpi-item"><div className="id-kpi-label">报告数量</div><div className="id-kpi-value">{industry.reportCount.toLocaleString()}</div></div>
        <div className="id-kpi-item"><div className="id-kpi-label">热度指数</div><div className="id-kpi-value id-amber">{industry.hotIndex}</div></div>
      </div>

      {/* 报告列表（真实抓取时标题/链接来自公开搜索） */}
      <div className="id-reports-card">
        <Text strong style={{ fontSize: 13 }}>数据报告</Text>
        {industry.reports.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', padding: '12px 0' }}>暂无报告，点击"刷新数据"尝试获取最新报告</Text>
        ) : (
          industry.reports.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Text style={{ fontSize: 12, color: '#6b7280', width: 90, flexShrink: 0 }}>{r.publishedAt}</Text>
              <Tooltip title={r.title}>
                <a href={r.url} target="_blank" rel="noreferrer"
                   style={{ fontSize: 12, color: '#1a1a2e', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.title}
                </a>
              </Tooltip>
              <Text style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{r.institution}</Text>
            </div>
          ))
        )}
        <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 8 }}>
          数据来源：{industry.sources?.join('、') || '公开渠道聚合'}
        </Text>
      </div>
    </div>
  );
};

export default IndustryDetailPanel;
