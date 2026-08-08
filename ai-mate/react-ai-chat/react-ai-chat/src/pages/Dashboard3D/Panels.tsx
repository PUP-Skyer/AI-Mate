/**
 * 3D 看板数据面板组件（赛博朋克深色 + 优雅浅色双主题）
 * 左侧3张卡 + 右侧3张卡，内嵌 ECharts 图表
 * 支持：数值滚动动画、深色毛玻璃、霓虹辉光、进度条流动、告警闪烁
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Typography, Tag, Row, Col, Tooltip } from 'antd';
import { useAIStore } from '../../store/aiStore';
import { POLICIES } from '../../pages/AIPolicy/data';
import { POLICY_LEVEL_COLORS } from '../../pages/AIPolicy/types';
import { getDashboardTheme, createChartTheme } from './dashboard-theme';
import type { DashboardTheme } from './dashboard-theme';
import { useCountUp, formatNumber } from './hooks/useCountUp';
import { useSimulatedNumber } from './hooks/useSimulatedData';
import './dashboard-animations.css';

const { Text, Title } = Typography;

// ===== 玻璃拟态卡片容器（双主题） =====
const GlassCard: React.FC<{
  children: React.ReactNode;
  width?: number | string;
  height?: number;
  style?: React.CSSProperties;
  alert?: boolean;
  accent?: string;
}> = ({ children, width = '100%', height, style, alert, accent }) => {
  const theme = useAIStore((s) => s.settings.theme);
  const isDark = theme === 'dark';
  const t = getDashboardTheme(isDark);

  return (
    <div
      className={alert ? 'dash-alert-blink' : 'dash-card-enter'}
      style={{
        width,
        height,
        background: t.glassBg,
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        borderRadius: 12,
        border: `1px solid ${accent ? accent + '33' : t.glassBorder}`,
        boxShadow: t.glassShadow,
        padding: '12px 14px',
        color: t.textPrimary,
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* 深色模式顶部高光线 */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accent ?? t.textAccent}66, transparent)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

// ===== 左侧上层：行业资讯报告总数量统计 =====
export const ReportCountCard: React.FC = () => {
  const theme = useAIStore((s) => s.settings.theme);
  const isDark = theme === 'dark';
  const t = getDashboardTheme(isDark);
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const goReport = () => setCurrentPage('industry-report');

  const { value, refreshKey } = useSimulatedNumber({ interval: 5000, variance: 30, initial: 12847 });
  const displayValue = useCountUp(value, 1200, [refreshKey]);

  return (
    <GlassCard height={200} style={{ cursor: 'pointer' }} accent={t.textAccent}>
      <div
        role="button"
        tabIndex={0}
        onClick={goReport}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goReport(); } }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, outline: 'none' }}
      >
        <Text style={{ fontSize: 12, color: t.textSecondary }}>行业资讯报告总数量</Text>
        <div style={{ marginTop: 8 }}>
          <Title
            level={2}
            className={isDark ? 'dash-neon-text' : ''}
            style={
              {
                margin: 0, fontSize: 32, color: t.textAccent, fontWeight: 800,
                '--neon-color': t.textAccent,
              } as React.CSSProperties
            }
          >
            {formatNumber(displayValue)}
          </Title>
          <Text className={refreshKey % 2 === 0 ? 'dash-data-refresh' : ''} style={{ fontSize: 12, color: '#28a745' }}>
            ↑ 23.5% 较上月
          </Text>
        </div>
        {/* 流动进度条 */}
        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'rgba(122,138,154,0.1)', overflow: 'hidden' }}>
          <div
            className="dash-progress-bar"
            style={
              {
                height: '100%', width: '75%', borderRadius: 2,
                '--progress-from': t.textAccent,
                '--progress-to': '#4a9eff',
              } as React.CSSProperties
            }
          />
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 20 }}>
          <div>
            <Text style={{ fontSize: 11, color: t.textSecondary }}>本周新增</Text>
            <div style={{ fontSize: 18, fontWeight: 700, color: t.textPrimary }}>+342</div>
          </div>
          <div>
            <Text style={{ fontSize: 11, color: t.textSecondary }}>日均更新</Text>
            <div style={{ fontSize: 18, fontWeight: 700, color: t.textPrimary }}>48</div>
          </div>
        </div>
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Tooltip title="查看行业报告列表与详情">
            <Text style={{ fontSize: 10, color: t.textAccent, fontWeight: 600 }}>查看全部报告 →</Text>
          </Tooltip>
        </div>
      </div>
    </GlassCard>
  );
};

// ===== 左侧中层：最新 AI 创业政策 =====
export const AIPolicyCard: React.FC = () => {
  const theme = useAIStore((s) => s.settings.theme);
  const isDark = theme === 'dark';
  const t = getDashboardTheme(isDark);
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);

  const goPolicyPage = (section?: 'support' | 'official') => {
    if (section && typeof window !== 'undefined') {
      window.__AI_POLICY_SCROLL_TO__ = section;
    }
    setCurrentPage('ai-policy');
  };

  const latest = POLICIES.slice(0, 3);

  return (
    <GlassCard height={200} style={{ cursor: 'pointer', padding: '10px 12px' }} accent="#ffa502">
      <div
        role="button"
        tabIndex={0}
        onClick={() => goPolicyPage()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goPolicyPage(); } }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, outline: 'none', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>最新 AI 创业政策</Text>
          <Tooltip title="查看全部政策列表与详情">
            <Text style={{ fontSize: 10, color: t.textAccent, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>查看全部 →</Text>
          </Tooltip>
        </div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center', minHeight: 0 }}>
          {latest.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Text style={{ fontSize: 10, color: t.textSecondary, fontVariantNumeric: 'tabular-nums', flexShrink: 0, width: 34 }}>
                {p.publishedAt.slice(5)}
              </Text>
              <Tag
                color={POLICY_LEVEL_COLORS[p.level]}
                style={{ fontSize: 9, borderRadius: 3, padding: '0 4px', lineHeight: '16px', margin: 0, flexShrink: 0 }}
              >
                {p.level}
              </Tag>
              <Text
                style={{
                  fontSize: 10, color: t.textPrimary, flex: 1, minWidth: 0,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {p.title}
              </Text>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: `1px solid ${isDark ? 'rgba(0,212,170,0.1)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', gap: 12 }}>
          <span
            role="button" tabIndex={0}
            onClick={(e) => { e.stopPropagation(); goPolicyPage('support'); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); goPolicyPage('support'); } }}
            style={{ fontSize: 10, color: t.textAccent, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            扶持政策链接 →
          </span>
          <span
            role="button" tabIndex={0}
            onClick={(e) => { e.stopPropagation(); goPolicyPage('official'); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); goPolicyPage('official'); } }}
            style={{ fontSize: 10, color: '#a855f7', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            单位官网 →
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

// ===== 左侧下层：行业数据查询 =====
export const IndustryDataCard: React.FC = () => {
  const theme = useAIStore((s) => s.settings.theme);
  const t = getDashboardTheme(isDark(theme));
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const goIndustryData = () => setCurrentPage('industry-data');

  const industries = ['人工智能', '新能源', '智慧餐饮', '智能制造', '生物医药', '金融科技', '跨境电商'];

  return (
    <GlassCard height={200} style={{ cursor: 'pointer' }} accent="#a855f7">
      <div
        role="button" tabIndex={0}
        onClick={goIndustryData}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goIndustryData(); } }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, outline: 'none' }}
      >
        <Text style={{ fontSize: 12, color: t.textSecondary }}>行业数据查询</Text>
        <div style={{ marginTop: 8 }}>
          <Title level={2} className={theme === 'dark' ? 'dash-neon-text' : ''} style={{ margin: 0, fontSize: 32, color: '#a855f7', fontWeight: 800 }}>
            7
          </Title>
          <Text style={{ fontSize: 12, color: '#28a745' }}>大行业 · 数据报告与图表</Text>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {industries.map((tag) => (
            <Tag
              key={tag}
              style={{
                fontSize: 10, borderRadius: 4,
                background: 'rgba(168,85,247,0.1)',
                color: '#a855f7',
                border: '1px solid rgba(168,85,247,0.2)',
                padding: '0 6px', lineHeight: '20px',
              }}
            >
              {tag}
            </Tag>
          ))}
        </div>
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Tooltip title="查看 7 大行业数据报告与数据图">
            <Text style={{ fontSize: 10, color: t.textAccent, fontWeight: 600 }}>进入行业数据中心 →</Text>
          </Tooltip>
        </div>
      </div>
    </GlassCard>
  );
};

function isDark(theme: string): boolean {
  return theme === 'dark';
}

// ===== 右侧上层：AI行业大事件时间轴 =====
export const TimelineCard: React.FC = () => {
  const theme = useAIStore((s) => s.settings.theme);
  const t = getDashboardTheme(isDark(theme));
  const miniChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!miniChartRef.current) return;
    const chart = echarts.init(miniChartRef.current);
    const ct = createChartTheme(t);
    chart.setOption({
      grid: { top: 4, right: 4, bottom: 4, left: 4 },
      xAxis: { type: 'category', data: ['一', '二', '三', '四', '五', '六', '日'], show: false },
      yAxis: { type: 'value', show: false },
      series: [{
        data: [120, 132, 101, 134, 190, 230, 210],
        type: 'line', smooth: true, symbol: 'none',
        lineStyle: { color: ct.colors[0], width: 1.5 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: ct.colors[0] + '33' },
          { offset: 1, color: ct.colors[0] + '00' },
        ] } },
      }],
    });
    return () => chart.dispose();
  }, [theme, t]);

  const events = [
    { date: '07-28', title: 'OpenAI 发布 GPT-5 预览版', tag: '模型' },
    { date: '07-25', title: '工信部发布 AI 产业新规划', tag: '政策' },
    { date: '07-22', title: '字节跳动开源大模型项目', tag: '开源' },
    { date: '07-18', title: '百度文心一言用户破亿', tag: '产品' },
  ];

  return (
    <GlassCard height={200}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary }}>AI 行业大事件</Text>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 10, color: t.textSecondary }}>2026-07-28 周一</Text>
          <div ref={miniChartRef} style={{ width: 70, height: 20 }} />
        </div>
      </div>
      <div style={{ marginTop: 6, position: 'relative', paddingLeft: 14 }}>
        <div style={{ position: 'absolute', left: 4, top: 3, bottom: 3, width: 2, background: `linear-gradient(180deg, ${t.textAccent}, ${t.textWarning})`, borderRadius: 1, opacity: 0.4 }} />
        {events.map((evt, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 4 }}>
            <div style={{
              position: 'absolute', left: -14 + 2, top: 4, width: 6, height: 6, borderRadius: '50%',
              background: i === 0 ? t.textAccent : t.textSecondary,
              border: '1.5px solid ' + (isDark(theme) ? '#0f0f23' : '#fff'),
              boxShadow: i === 0 && isDark(theme) ? `0 0 6px ${t.textAccent}` : 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 10, color: t.textSecondary, minWidth: 30 }}>{evt.date}</Text>
              <Tag style={{ fontSize: 9, padding: '0 4px', height: 15, lineHeight: '13px', borderRadius: 2, margin: 0 }}>{evt.tag}</Tag>
              <Text style={{ fontSize: 10, color: t.textPrimary }}>{evt.title}</Text>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${isDark(theme) ? 'rgba(0,212,170,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
        <Text style={{ fontSize: 10, fontWeight: 500, color: t.textPrimary }}>今日速递</Text>
        <Text style={{ fontSize: 9, color: t.textSecondary, display: 'block', marginTop: 1 }}>{'\u2022'} 阿里云通义千问降价 85%</Text>
        <Text style={{ fontSize: 9, color: t.textSecondary, display: 'block' }}>{'\u2022'} 马斯克宣布 xAI 新一轮融资</Text>
      </div>
    </GlassCard>
  );
};

// ===== 右侧中层：AI渗透率环形饼图 =====
export const PenetrationChartCard: React.FC = () => {
  const theme = useAIStore((s) => s.settings.theme);
  const t: DashboardTheme = getDashboardTheme(isDark(theme));
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    const ct = createChartTheme(t);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {d}%', ...ct.tooltip },
      legend: { show: false },
      series: [{
        name: 'AI渗透率', type: 'pie',
        radius: ['42%', '68%'], center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 11, fontWeight: 'bold', color: t.textPrimary },
          itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0,212,170,0.3)' },
        },
        labelLine: { show: false },
        data: [
          { value: 35, name: '互联网', itemStyle: { color: ct.colors[0] } },
          { value: 25, name: '金融', itemStyle: { color: ct.colors[1] } },
          { value: 18, name: '制造', itemStyle: { color: ct.colors[2] } },
          { value: 12, name: '医疗', itemStyle: { color: ct.colors[3] } },
          { value: 10, name: '教育', itemStyle: { color: ct.colors[4] } },
        ],
      }],
    });
    return () => chart.dispose();
  }, [theme, t]);

  const details = [
    { name: '互联网', value: '35%', color: t.chartColors[0] },
    { name: '金融', value: '25%', color: t.chartColors[1] },
    { name: '制造', value: '18%', color: t.chartColors[2] },
    { name: '医疗', value: '12%', color: t.chartColors[3] },
    { name: '教育', value: '10%', color: t.chartColors[4] },
  ];

  return (
    <GlassCard>
      <Text style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary }}>各行业 AI 渗透率</Text>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
        <div ref={chartRef} style={{ width: 130, height: 120 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 8 }}>
          {details.map((d) => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: d.color, boxShadow: isDark(theme) ? `0 0 4px ${d.color}` : 'none' }} />
                <Text style={{ fontSize: 10, color: t.textSecondary }}>{d.name}</Text>
              </div>
              <Text strong style={{ fontSize: 10, color: t.textPrimary }}>{d.value}</Text>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

// ===== 右侧下层：AI工具库网格展示 =====
export const ToolLibraryCard: React.FC = () => {
  const theme = useAIStore((s) => s.settings.theme);
  const t = getDashboardTheme(isDark(theme));

  const tools = [
    { name: 'ChatGPT', category: '对话', color: '#10a37f' },
    { name: 'Midjourney', category: '绘画', color: '#a855f7' },
    { name: 'Claude', category: '对话', color: '#d4a574' },
    { name: 'Stable Diffusion', category: '绘画', color: '#ff6b6b' },
    { name: 'Copilot', category: '编程', color: '#4a9eff' },
    { name: 'Runway', category: '视频', color: '#ffa502' },
    { name: 'Notion AI', category: '办公', color: '#36cfc9' },
    { name: 'Sora', category: '视频', color: '#00d4aa' },
  ];

  return (
    <GlassCard>
      <Text style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary }}>AI 工具库</Text>
      <Row gutter={[6, 6]} style={{ marginTop: 8 }}>
        {tools.map((tool) => (
          <Col span={6} key={tool.name}>
            <div
              style={{
                background: isDark(theme) ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.5)',
                borderRadius: 8, padding: '6px 2px', textAlign: 'center',
                border: `1px solid ${isDark(theme) ? 'rgba(0,212,170,0.1)' : 'rgba(0,0,0,0.04)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isDark(theme)
                  ? `0 2px 12px ${tool.color}44, 0 0 0 1px ${tool.color}44`
                  : '0 2px 8px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = tool.color + '44';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = isDark(theme) ? 'rgba(0,212,170,0.1)' : 'rgba(0,0,0,0.04)';
              }}
            >
              <div
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: `${tool.color}1a`,
                  margin: '0 auto 3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: tool.color,
                }}
              >
                {tool.name[0]}
              </div>
              <Text style={{ fontSize: 9, color: t.textPrimary, display: 'block', lineHeight: 1.2 }}>{tool.name}</Text>
              <Text style={{ fontSize: 8, color: t.textSecondary }}>{tool.category}</Text>
            </div>
          </Col>
        ))}
      </Row>
    </GlassCard>
  );
};
