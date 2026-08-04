/**
 * 行业报告详情面板
 * 面包屑返回 + 衬线大标题 + 元信息 + 操作按钮 + KPI + ECharts + 正文章节 + 相关报告
 */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Tag, Button, Space, Tooltip, Typography, message, Breadcrumb } from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { IndustryReport } from '../types';

const { Text, Title } = Typography;

interface Props {
  report: IndustryReport;
  favorites: Set<string>;
  onBack: () => void;
  onOpenRelated: (report: IndustryReport) => void;
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

const ReportDetailPanel: React.FC<Props> = ({
  report,
  favorites,
  onBack,
  onOpenRelated,
  onToggleFavorite,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInst = useRef<echarts.ECharts | null>(null);

  // ECharts 渲染（趋势折线 + 结构环形）
  useEffect(() => {
    if (!chartRef.current || !report.chart) return;
    const chart = echarts.init(chartRef.current);
    chartInst.current = chart;

    const isTrend = report.chart.kind === 'trend';
    const option = isTrend
      ? {
          tooltip: { trigger: 'axis' },
          grid: { left: 40, right: 16, top: 24, bottom: 28 },
          xAxis: {
            type: 'category',
            data: report.chart.series.map((s) => s.name),
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280', fontSize: 11 },
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f0f2f5' } },
            axisLabel: { color: '#9ca3af', fontSize: 11 },
          },
          series: [
            {
              type: 'line',
              smooth: true,
              data: report.chart.series.map((s) => s.value),
              lineStyle: { color: '#1e40af', width: 3 },
              itemStyle: { color: '#f59e0b', borderColor: '#fff', borderWidth: 2 },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(30,64,175,0.25)' },
                  { offset: 1, color: 'rgba(30,64,175,0.02)' },
                ]),
              },
            },
          ],
        }
      : {
          tooltip: { trigger: 'item' },
          legend: { bottom: 0, textStyle: { color: '#6b7280', fontSize: 11 } },
          series: [
            {
              type: 'pie',
              radius: ['42%', '68%'],
              center: ['50%', '44%'],
              avoidLabelOverlap: true,
              itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
              label: { color: '#374151', fontSize: 11 },
              data: report.chart.series.map((s) => ({
                name: s.name,
                value: s.value,
                itemStyle: s.color ? { color: s.color } : undefined,
              })),
            },
          ],
        };

    chart.setOption(option);
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartInst.current = null;
    };
  }, [report]);

  const handleDownload = () => {
    message.info('下载功能即将上线，敬请期待');
  };

  return (
    <div className="ir-enter">
      {/* 面包屑 + 返回 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Button icon={<ArrowLeftOutlined />} size="small" onClick={onBack}>
          返回列表
        </Button>
        <Breadcrumb
          items={[{ title: '行业报告' }, { title: report.category }, { title: report.id }]}
        />
      </div>

      {/* 元信息头 */}
      <div className="ir-detail-head">
        <Space size={8} style={{ marginBottom: 6 }}>
          <Tag color={CATEGORY_COLORS[report.category] || 'default'}>{report.category}</Tag>
          <Text style={{ fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
            {report.id}
          </Text>
        </Space>
        <h1 className="ir-serif-title ir-detail">{report.title}</h1>
        <div className="ir-rule" />
        <Space size={16} wrap>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            发布机构：<Text strong style={{ color: '#374151' }}>{report.institution}</Text>
          </Text>
          {report.author && (
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              作者：<Text strong style={{ color: '#374151' }}>{report.author}</Text>
            </Text>
          )}
          <Text style={{ fontSize: 12, color: '#6b7280' }}>发布于 {report.publishedAt}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            <FileTextOutlined style={{ marginRight: 4 }} />
            {report.pageCount} 页
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            <EyeOutlined style={{ marginRight: 4 }} />
            {report.readCount.toLocaleString()} 阅读
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>收藏 {report.favoriteCount}</Text>
        </Space>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            icon={favorites.has(report.id) ? <StarFilled /> : <StarOutlined />}
            onClick={() => onToggleFavorite(report.id)}
            type={favorites.has(report.id) ? 'primary' : 'default'}
          >
            {favorites.has(report.id) ? '已收藏' : '收藏'}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            下载 PDF
          </Button>
        </div>
      </div>

      {/* KPI 条 */}
      <div className="ir-kpi-row" style={{ marginTop: 0 }}>
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">阅读量</div>
          <div className="ir-kpi-value">{report.readCount.toLocaleString()}</div>
        </div>
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">热度指数</div>
          <div className="ir-kpi-value ir-amber">{report.heatIndex}</div>
        </div>
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">收藏数</div>
          <div className="ir-kpi-value">{report.favoriteCount.toLocaleString()}</div>
        </div>
        <div className="ir-kpi-item">
          <div className="ir-kpi-label">报告页数</div>
          <div className="ir-kpi-value">{report.pageCount}</div>
        </div>
      </div>

      {/* 摘要 + 关键词 */}
      <div className="ir-detail-section">
        <div className="ir-section-heading">报告摘要</div>
        <p className="ir-detail-body" style={{ marginBottom: 12 }}>
          {report.summary}
        </p>
        <Space size={6} wrap>
          {report.keywords.map((k) => (
            <Tag key={k} style={{ borderRadius: 4 }}>
              {k}
            </Tag>
          ))}
        </Space>
      </div>

      {/* 图表 */}
      {report.chart && (
        <div className="ir-detail-section">
          <div className="ir-section-heading">{report.chart.title}</div>
          <div ref={chartRef} style={{ width: '100%', height: 260 }} />
        </div>
      )}

      {/* 正文章节 */}
      {report.sections.map((sec, idx) => (
        <div className="ir-detail-section" key={sec.id}>
          <div className="ir-section-heading">
            <span className="ir-seq">{idx + 1}</span>
            {sec.heading}
          </div>
          {sec.type === 'points' && sec.points ? (
            <ul className="ir-detail-points">
              {sec.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="ir-detail-body">{sec.content}</p>
          )}
        </div>
      ))}

      {/* 相关报告 */}
      {report.relatedIds.length > 0 && (
        <div className="ir-detail-section">
          <div className="ir-section-heading">相关报告</div>
          <div>
            {report.relatedIds.map((rid) => {
              const rel = window.__IR_REPORTS_MAP__?.[rid];
              return rel ? (
                <div key={rid} className="ir-related-item" onClick={() => onOpenRelated(rel)}>
                  <Text strong style={{ fontSize: 13, color: '#1e40af' }}>
                    {rel.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#6b7280', flexShrink: 0, marginLeft: 12 }}>
                    {rel.category} · {rel.publishedAt}
                  </Text>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// 全局报告索引（供相关报告跳转使用，由页面容器注入）
declare global {
  interface Window {
    __IR_REPORTS_MAP__?: Record<string, IndustryReport>;
  }
}

export default ReportDetailPanel;
