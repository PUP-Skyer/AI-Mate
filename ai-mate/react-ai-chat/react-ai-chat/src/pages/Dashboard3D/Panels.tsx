/**
 * 3D 看板数据面板组件（紧凑版）
 * 左侧3张卡 + 右侧3张卡，内嵌 ECharts 图表
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Typography, Tag, Row, Col, Tooltip } from 'antd';
import { useAIStore } from '../../store/aiStore';
import { POLICIES } from '../../pages/AIPolicy/data';
import { POLICY_LEVEL_COLORS } from '../../pages/AIPolicy/types';

const { Text, Title } = Typography;

// ===== 玻璃拟态卡片容器（紧凑版） =====
const GlassCard: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ children, width = 260, height, style }) => (
  <div
    style={{
      width,
      height,
      background: 'rgba(255, 255, 255, 0.72)',
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      borderRadius: 12,
      border: '1px solid rgba(255, 255, 255, 0.55)',
      boxShadow: '0 4px 16px rgba(31, 110, 185, 0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
      padding: '12px 14px',
      color: '#1a1a2e',
      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

// ===== 左侧上层：行业资讯报告总数量统计（点击跳转行业报告页） =====
export const ReportCountCard: React.FC = () => {
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const goReport = () => setCurrentPage('industry-report');
  return (
    <GlassCard width={280} height={200} style={{ cursor: 'pointer' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={goReport}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goReport();
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, outline: 'none' }}
      >
        <Text type="secondary" style={{ fontSize: 12, color: '#5a6c7d' }}>
          行业资讯报告总数量
        </Text>
        <div style={{ marginTop: 8 }}>
          <Title level={2} style={{ margin: 0, fontSize: 32, color: '#1a5fb4', fontWeight: 800 }}>
            12,847
          </Title>
          <Text style={{ fontSize: 12, color: '#28a745' }}>↑ 23.5% 较上月</Text>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 20 }}>
          <div>
            <Text style={{ fontSize: 11, color: '#888' }}>本周新增</Text>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>+342</div>
          </div>
          <div>
            <Text style={{ fontSize: 11, color: '#888' }}>日均更新</Text>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>48</div>
          </div>
        </div>
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Tooltip title="查看行业报告列表与详情">
            <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 600 }}>
              查看全部报告 →
            </Text>
          </Tooltip>
        </div>
      </div>
    </GlassCard>
  );
};

// ===== 左侧中层：最新 AI 创业政策（点击跳转政策列表页） =====
export const AIPolicyCard: React.FC = () => {
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const goPolicyPage = (section?: 'support' | 'official') => {
    if (section && typeof window !== 'undefined') {
      window.__AI_POLICY_SCROLL_TO__ = section;
    }
    setCurrentPage('ai-policy');
  };

  // 取最新 3 条（mock 已按时间倒序），与列表页同源（单一数据源）
  const latest = POLICIES.slice(0, 3);

  return (
    <GlassCard width={280} height={200} style={{ cursor: 'pointer', padding: '10px 12px' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => goPolicyPage()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goPolicyPage();
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, outline: 'none', overflow: 'hidden' }}
      >
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>最新 AI 创业政策</Text>
          <Tooltip title="查看全部政策列表与详情">
            <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>
              查看全部 →
            </Text>
          </Tooltip>
        </div>

        {/* 政策条目（3 条，每条含 MM-DD 时间戳 + 级别 Tag，标题单行截断） */}
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
            justifyContent: 'center',
            minHeight: 0,
          }}
        >
          {latest.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 10, color: '#8c8c8c',
                  fontVariantNumeric: 'tabular-nums', flexShrink: 0, width: 34,
                }}
              >
                {p.publishedAt.slice(5)} {/* MM-DD 时间戳 */}
              </Text>
              <Tag
                color={POLICY_LEVEL_COLORS[p.level]}
                style={{ fontSize: 9, borderRadius: 3, padding: '0 4px', lineHeight: '16px', margin: 0, flexShrink: 0 }}
              >
                {p.level}
              </Tag>
              <Text
                style={{
                  fontSize: 10, color: '#333', flex: 1, minWidth: 0,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {p.title}
              </Text>
            </div>
          ))}
        </div>

        {/* 底部链接入口：扶持政策链接 | 单位官网（点击跳列表页对应锚点） */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 6,
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            gap: 12,
          }}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); goPolicyPage('support'); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); goPolicyPage('support'); }
            }}
            style={{ fontSize: 10, color: '#1E40AF', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            扶持政策链接 →
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); goPolicyPage('official'); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); goPolicyPage('official'); }
            }}
            style={{ fontSize: 10, color: '#6b4c9a', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            单位官网 →
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

// ===== 左侧下层：行业数据查询（点击跳转行业数据页） =====
export const IndustryDataCard: React.FC = () => {
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const goIndustryData = () => setCurrentPage('industry-data');
  return (
    <GlassCard width={280} height={200} style={{ cursor: 'pointer' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={goIndustryData}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goIndustryData();
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, outline: 'none' }}
      >
        <Text type="secondary" style={{ fontSize: 12, color: '#5a6c7d' }}>
          行业数据查询
        </Text>
        <div style={{ marginTop: 8 }}>
          <Title level={2} style={{ margin: 0, fontSize: 32, color: '#6b4c9a', fontWeight: 800 }}>
            7
          </Title>
          <Text style={{ fontSize: 12, color: '#28a745' }}>大行业 · 数据报告与图表</Text>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['人工智能', '新能源', '智慧餐饮', '智能制造', '生物医药', '金融科技', '跨境电商'].map((tag) => (
            <Tag key={tag} style={{ fontSize: 10, borderRadius: 4, background: 'rgba(107,76,154,0.08)', color: '#6b4c9a', border: '1px solid rgba(107,76,154,0.15)', padding: '0 6px', lineHeight: '20px' }}>
              {tag}
            </Tag>
          ))}
        </div>
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Tooltip title="查看 7 大行业数据报告与数据图">
            <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 600 }}>
              进入行业数据中心 →
            </Text>
          </Tooltip>
        </div>
      </div>
    </GlassCard>
  );
};

// ===== 右侧上层：AI行业大事件时间轴 =====
export const TimelineCard: React.FC = () => {
  const miniChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!miniChartRef.current) return;
    const chart = echarts.init(miniChartRef.current);
    chart.setOption({
      grid: { top: 4, right: 4, bottom: 4, left: 4 },
      xAxis: { type: 'category', data: ['一', '二', '三', '四', '五', '六', '日'], show: false },
      yAxis: { type: 'value', show: false },
      series: [{
        data: [120, 132, 101, 134, 190, 230, 210],
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#1677ff', width: 1.5 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(22,119,255,0.2)' }, { offset: 1, color: 'rgba(22,119,255,0)' }] } },
      }],
    });
    return () => chart.dispose();
  }, []);

  const events = [
    { date: '07-28', title: 'OpenAI 发布 GPT-5 预览版', tag: '模型' },
    { date: '07-25', title: '工信部发布 AI 产业新规划', tag: '政策' },
    { date: '07-22', title: '字节跳动开源大模型项目', tag: '开源' },
    { date: '07-18', title: '百度文心一言用户破亿', tag: '产品' },
  ];

  return (
    <GlassCard width={290}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>AI 行业大事件</Text>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 10, color: '#888' }}>2026-07-28 周一</Text>
          <div ref={miniChartRef} style={{ width: 70, height: 26, marginTop: 2 }} />
        </div>
      </div>
      <div style={{ marginTop: 8, position: 'relative', paddingLeft: 14 }}>
        <div style={{ position: 'absolute', left: 4, top: 3, bottom: 3, width: 2, background: 'linear-gradient(180deg, #1677ff, #36cfc9)', borderRadius: 1, opacity: 0.3 }} />
        {events.map((evt, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 6 }}>
            <div style={{ position: 'absolute', left: -14 + 2, top: 4, width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#1677ff' : '#c0c0c0', border: '1.5px solid #fff' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 10, color: '#888', minWidth: 30 }}>{evt.date}</Text>
              <Tag style={{ fontSize: 9, padding: '0 4px', height: 15, lineHeight: '13px', borderRadius: 2, margin: 0 }}>{evt.tag}</Tag>
              <Text style={{ fontSize: 10, color: '#333' }}>{evt.title}</Text>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <Text style={{ fontSize: 10, fontWeight: 500, color: '#555' }}>今日速递</Text>
        <Text style={{ fontSize: 9, color: '#888', display: 'block', marginTop: 2 }}>• 阿里云通义千问降价 85%</Text>
        <Text style={{ fontSize: 9, color: '#888', display: 'block' }}>• 马斯克宣布 xAI 新一轮融资</Text>
      </div>
    </GlassCard>
  );
};

// ===== 右侧中层：AI渗透率环形饼图 =====
export const PenetrationChartCard: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {d}%', textStyle: { fontSize: 10 } },
      legend: { show: false },
      series: [{
        name: 'AI渗透率',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 11, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: 35, name: '互联网', itemStyle: { color: '#1677ff' } },
          { value: 25, name: '金融', itemStyle: { color: '#36cfc9' } },
          { value: 18, name: '制造', itemStyle: { color: '#52c41a' } },
          { value: 12, name: '医疗', itemStyle: { color: '#fa8c16' } },
          { value: 10, name: '教育', itemStyle: { color: '#eb2f96' } },
        ],
      }],
    });
    return () => chart.dispose();
  }, []);

  const details = [
    { name: '互联网', value: '35%', color: '#1677ff' },
    { name: '金融', value: '25%', color: '#36cfc9' },
    { name: '制造', value: '18%', color: '#52c41a' },
    { name: '医疗', value: '12%', color: '#fa8c16' },
    { name: '教育', value: '10%', color: '#eb2f96' },
  ];

  return (
    <GlassCard width={290}>
      <Text style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>各行业 AI 渗透率</Text>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
        <div ref={chartRef} style={{ width: 130, height: 120 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 8 }}>
          {details.map((d) => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: d.color }} />
                <Text style={{ fontSize: 10, color: '#555' }}>{d.name}</Text>
              </div>
              <Text strong style={{ fontSize: 10, color: '#333' }}>{d.value}</Text>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

// ===== 右侧下层：AI工具库网格展示 =====
export const ToolLibraryCard: React.FC = () => {
  const tools = [
    { name: 'ChatGPT', category: '对话', color: '#10a37f' },
    { name: 'Midjourney', category: '绘画', color: '#1a1a1a' },
    { name: 'Claude', category: '对话', color: '#d4a574' },
    { name: 'Stable Diffusion', category: '绘画', color: '#ff6b6b' },
    { name: 'Copilot', category: '编程', color: '#2b2b2b' },
    { name: 'Runway', category: '视频', color: '#000' },
    { name: 'Notion AI', category: '办公', color: '#000' },
    { name: 'Sora', category: '视频', color: '#0066cc' },
  ];

  return (
    <GlassCard width={290}>
      <Text style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>AI 工具库</Text>
      <Row gutter={[6, 6]} style={{ marginTop: 8 }}>
        {tools.map((tool) => (
          <Col span={6} key={tool.name}>
            <div
              style={{
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 8,
                padding: '6px 2px',
                textAlign: 'center',
                border: '1px solid rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: `${tool.color}12`,
                  margin: '0 auto 3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: tool.color,
                }}
              >
                {tool.name[0]}
              </div>
              <Text style={{ fontSize: 9, color: '#333', display: 'block', lineHeight: 1.2 }}>{tool.name}</Text>
              <Text style={{ fontSize: 8, color: '#999' }}>{tool.category}</Text>
            </div>
          </Col>
        ))}
      </Row>
    </GlassCard>
  );
};
