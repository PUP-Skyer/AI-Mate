/**
 * 趋势洞察面板 — 温暖杂志风
  * 浅底色 + 橙色主调（分区式卡片布局）
  * 四大分区：封面故事 / 时间轴+路径 / 热度分布+标签云 / 增长曲线+分析
 */

import React, { useState, useCallback } from 'react';
import { Input, Button, Typography, Tooltip, Tag } from 'antd';
import { SendOutlined, DownOutlined, UpOutlined, DownloadOutlined } from '@ant-design/icons';
import { chatWithZhipu } from '../../services/aiService';
import { SCOUT_PALETTE, SCOUT_FONTS, SCOUT_RADIUS, SCOUT_SHADOWS, SCOUT_TEXTURES } from './scout-theme';
import './scout-animations.css';
import ScoutEmptyState from './shared/ScoutEmptyState';
import ScoutSectionHeader from './shared/ScoutSectionHeader';
import ScoutLoadingSkeleton from './shared/ScoutLoadingSkeleton';
import TimelineChart from './svg/TimelineChart';
import type { TimelineEvent } from './svg/TimelineChart';
import HeatGauge from './svg/HeatGauge';
import TrendCurve from './svg/TrendCurve';
import AreaChart from './svg/AreaChart';
import DonutChart from './svg/DonutChart';
import type { DonutSlice } from './svg/DonutChart';

const { Text, Paragraph } = Typography;
const T = SCOUT_PALETTE.trend;

// ─── 数据结构 ─────────────────────────────────────────────

interface TrendData {
  timeline: TimelineEvent[];
  heatScore: number;
  heatLabel: string;
  tags: { text: string; weight: number; category: string }[];
  paths: {
    labels: string[];
    series: { name: string; data: number[] }[];
  };
  analysis: string;
  growth?: {
    labels: string[];
    current: number[];
    projected: number[];
  };
  distribution?: { label: string; value: number }[];
}

// ─── JSON 解析 ────────────────────────────────────────────

function parseTrendResponse(raw: string): TrendData | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.timeline && parsed.heatScore !== undefined) {
      if (!parsed.growth) {
        parsed.growth = {
          labels: parsed.paths?.labels || [],
          current: parsed.paths?.series?.[0]?.data || [],
          projected: parsed.paths?.series?.[1]?.data || [],
        };
      }
      if (!parsed.distribution) {
        const cats = ['技术创新', '政策驱动', '市场需求'];
        parsed.distribution = cats.map((c, i) => ({ label: c, value: (i + 2) * 3 }));
      }
      return parsed as TrendData;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── 系统提示词 ───────────────────────────────────────────

const SYSTEM_PROMPT = `你是一位行业趋势研究专家。请根据用户提供的领域信息，分析发展趋势。

请严格按以下 JSON 格式输出（不要输出其他内容，不要使用 markdown 代码块包裹）：
{
  "timeline": [
    { "date": "2024-Q1", "event": "大事件描述", "impact": "high" }
  ],
  "heatScore": 78,
  "heatLabel": "高速增长期",
  "tags": [
    { "text": "标签名", "weight": 0.9, "category": "技术" }
  ],
  "paths": {
    "labels": ["2024", "2025", "2026"],
    "series": [
      { "name": "趋势A", "data": [30, 55, 80] }
    ]
  },
  "growth": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "current": [20, 35, 48, 62],
    "projected": [25, 42, 58, 75]
  },
  "distribution": [
    { "label": "技术创新", "value": 45 },
    { "label": "政策驱动", "value": 25 },
    { "label": "市场需求", "value": 30 }
  ],
  "analysis": "## 深度分析\\n详细的趋势分析文字..."
}`;

// ─── 标签云颜色映射 ──────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  '技术': '#d97757',
  '政策': '#6a9bcc',
  '市场': '#788c5d',
};

// ─── Markdown 清理：移除标题符号 #，保留正文 ─────────────

const cleanMarkdown = (text: string): string => text.replace(/^#{1,6}\s*/gm, '');

// ─── 步骤配置 ────────────────────────────────────────────

const STEPS = [
  { key: 'field' as const, label: '关注领域', emoji: '🔭', placeholder: '如：AI、Web3、新能源' },
  { key: 'timeRange' as const, label: '时间范围', emoji: '📅', placeholder: '如：2024-2026' },
  { key: 'focus' as const, label: '关注重点', emoji: '🎯', placeholder: '如：技术突破、市场格局' },
];

// ─── 空状态 SVG 场景 ─────────────────────────────────────

const EmptyScene: React.FC = () => (
  <svg width="180" height="140" viewBox="0 0 180 140">
    {/* 翻开的书本 */}
    <path d="M30 95 Q90 80 90 50 Q90 80 150 95 L150 110 Q90 95 90 65 Q90 95 30 110 Z"
      fill="#fff" stroke={T.border} strokeWidth="1.5" />
    <line x1="90" y1="50" x2="90" y2="95" stroke={T.border} strokeWidth="1" />
    {/* 左页文字线 */}
    <line x1="45" y1="78" x2="80" y2="72" stroke={T.primary} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
    <line x1="48" y1="85" x2="75" y2="80" stroke={T.primary} strokeWidth="1" opacity="0.2" strokeLinecap="round" />
    <line x1="50" y1="92" x2="78" y2="87" stroke={T.primary} strokeWidth="1" opacity="0.15" strokeLinecap="round" />
    {/* 右页文字线 */}
    <line x1="100" y1="72" x2="135" y2="78" stroke={T.secondary} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
    <line x1="105" y1="80" x2="132" y2="85" stroke={T.secondary} strokeWidth="1" opacity="0.2" strokeLinecap="round" />
    <line x1="102" y1="87" x2="130" y2="92" stroke={T.secondary} strokeWidth="1" opacity="0.15" strokeLinecap="round" />
    {/* 飘出的文字线条 */}
    <path d="M70 48 Q65 30 55 20" fill="none" stroke={T.primary} strokeWidth="1.2" opacity="0.25" strokeLinecap="round" />
    <path d="M90 45 Q92 25 88 12" fill="none" stroke={T.accent} strokeWidth="1.2" opacity="0.25" strokeLinecap="round" />
    <path d="M110 48 Q115 30 125 20" fill="none" stroke={T.secondary} strokeWidth="1.2" opacity="0.25" strokeLinecap="round" />
    {/* 装饰脉冲点 */}
    <circle cx="55" cy="18" r="3" fill={T.primary} opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
      <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="88" cy="10" r="2.5" fill={T.accent} opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
      <animate attributeName="r" values="2.5;3.5;2.5" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="125" cy="18" r="3" fill={T.secondary} opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.5;0.3" dur="1.8s" repeatCount="indefinite" />
      <animate attributeName="r" values="3;4.5;3" dur="1.8s" repeatCount="indefinite" />
    </circle>
    {/* 小装饰星 */}
    <circle cx="40" cy="35" r="1.5" fill={T.primary} opacity="0.15" />
    <circle cx="140" cy="35" r="1.5" fill={T.secondary} opacity="0.15" />
    <circle cx="90" cy="120" r="1" fill={T.accent} opacity="0.2" />
  </svg>
);

// ─── 示例数据（空状态预览用） ─────────────────────────────

const DEMO_DATA: TrendData = {
  timeline: [
    { date: '2024-Q1', event: '大模型推理成本下降 60%，AI 应用爆发', impact: 'high' },
    { date: '2024-Q3', event: '多模态能力成熟，Agent 进入商业化阶段', impact: 'high' },
    { date: '2025-Q1', event: '行业标准出台，监管框架逐步完善', impact: 'medium' },
    { date: '2025-Q3', event: '头部企业开放平台生态，中小团队加速入场', impact: 'medium' },
    { date: '2026-Q1', event: '垂直场景 Agent 成为主流商业模式', impact: 'high' },
  ],
  heatScore: 78,
  heatLabel: '高速增长期',
  tags: [
    { text: '大模型', weight: 0.95, category: '技术' },
    { text: 'AI Agent', weight: 0.9, category: '技术' },
    { text: '多模态', weight: 0.7, category: '技术' },
    { text: '监管合规', weight: 0.6, category: '政策' },
    { text: '数据安全', weight: 0.55, category: '政策' },
    { text: '行业应用', weight: 0.8, category: '市场' },
    { text: '企业服务', weight: 0.65, category: '市场' },
    { text: '智能硬件', weight: 0.5, category: '市场' },
  ],
  paths: {
    labels: ['2024', '2025', '2026'],
    series: [
      { name: '市场规模', data: [30, 55, 80] },
      { name: '渗透率', data: [18, 42, 68] },
    ],
  },
  growth: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    current: [20, 35, 48, 62],
    projected: [25, 42, 58, 75],
  },
  distribution: [
    { label: '技术创新', value: 45 },
    { label: '政策驱动', value: 25 },
    { label: '市场需求', value: 30 },
  ],
  analysis: `深度分析

一、技术演进趋势
AI 行业正处于从"模型能力竞争"向"应用生态竞争"的关键转折期。大模型推理成本的快速下降使中小团队获得与大厂同等的模型能力，垂直场景的深度定制成为差异化核心。

二、市场格局变化
2025 年头部厂商开始开放平台生态，Agent 开发门槛显著降低。预计到 2026 年，垂直行业 Agent 将贡献整体市场规模的 60% 以上，金融、医疗、教育三大场景率先规模化落地。

三、政策与合规影响
监管框架的完善为行业长期发展奠定基础。数据安全与合规能力将从"加分项"变为"准入门槛"，具备合规能力的企业将获得结构性优势。

四、创业者建议
1. 聚焦细分场景：选择 1-2 个垂直行业深耕，避免与大厂正面竞争
2. 构建数据壁垒：积累行业专属数据，形成可持续的竞争护城河
3. 关注合规成本：提前布局数据安全与合规体系，降低政策风险`,
};

// ─── 主组件 ───────────────────────────────────────────────

const TrendInsight: React.FC = () => {
  const [field, setField] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  // 默认展示示例报告，用户输入内容生成后替换为真实洞察
  const [data, setData] = useState<TrendData | null>(DEMO_DATA);
  const [rawText, setRawText] = useState(DEMO_DATA.analysis);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  const values = [field, timeRange, focus];
  const setters = [setField, setTimeRange, setFocus];

  const isStepComplete = (step: number) => {
    return values[step].trim().length > 0;
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentStep < 2) {
        if (isStepComplete(currentStep)) {
          setCurrentStep(s => s + 1);
        }
      } else {
        if (isStepComplete(0) && isStepComplete(1) && isStepComplete(2)) {
          handleGenerate();
        }
      }
    }
  }, [currentStep, field, timeRange, focus]);

  const handleGenerate = useCallback(async () => {
    if (!field || !timeRange || !focus) return;
    setLoading(true);
    setData(null);
    setRawText('');
    setShowDemo(false);

    const userContent = `关注领域: ${field}\n时间范围: ${timeRange}\n关注重点: ${focus}`;

    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: userContent }],
        { system_prompt: SYSTEM_PROMPT }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      setRawText(content);

      const parsed = parseTrendResponse(content);
      if (parsed) setData(parsed);
    } catch {
      setRawText('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [field, timeRange, focus]);

  const handleLoadDemo = useCallback(() => {
    setData(DEMO_DATA);
    setRawText(DEMO_DATA.analysis);
    setShowDemo(true);
  }, []);

  const handleDownload = () => {
    const blob = new Blob([rawText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '趋势洞察报告.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── 步骤指示器渲染 ──────────────────────────────────

  const renderStepIndicator = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 24px 8px',
      gap: 0,
    }}>
      {STEPS.map((step, i) => {
        const completed = isStepComplete(i);
        const active = currentStep === i;
        const circleColor = completed ? T.primary : active ? T.primary : T.border;
        const textColor = active ? T.text : completed ? T.textSecondary : T.textSecondary;

        return (
          <React.Fragment key={step.key}>
            {/* 圆形编号 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => setCurrentStep(i)}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: completed
                  ? `linear-gradient(135deg, ${T.primary}, #e8a87c)`
                  : active ? `${T.primary}15` : 'transparent',
                border: `2px solid ${circleColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: completed ? '#fff' : circleColor,
                fontFamily: SCOUT_FONTS.heading,
                transition: 'all 0.3s ease',
                boxShadow: active ? `0 0 0 3px ${T.primary}15` : 'none',
              }}>
                {completed ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10,
                color: textColor,
                fontFamily: SCOUT_FONTS.body,
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {/* 连接线 */}
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                maxWidth: 60,
                minWidth: 30,
                marginBottom: 18,
                background: completed
                  ? `linear-gradient(90deg, ${T.primary}, ${isStepComplete(i + 1) ? T.primary : T.border})`
                  : T.border,
                borderRadius: 1,
                transition: 'background 0.3s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── 输入区渲染 ────────────────────────────────────────

  const renderInputArea = () => {
    const step = STEPS[currentStep];
    const allComplete = isStepComplete(0) && isStepComplete(1) && isStepComplete(2);
    const isLastStep = currentStep === 2;

    return (
      <div style={{
        flexShrink: 0,
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: inputCollapsed ? 40 : 220,
      }}>
        {/* 折叠头部 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px 0',
            cursor: 'pointer',
          }}
          onClick={() => setInputCollapsed(!inputCollapsed)}
        >
          <Text style={{
            color: T.textSecondary,
            fontSize: 11,
            fontFamily: SCOUT_FONTS.heading,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            TREND INSIGHT
          </Text>
          {inputCollapsed
            ? <DownOutlined style={{ color: T.textSecondary, fontSize: 10 }} />
            : <UpOutlined style={{ color: T.textSecondary, fontSize: 10 }} />
          }
        </div>

        {!inputCollapsed && (
          <>
            {renderStepIndicator()}
            <div style={{
              padding: '8px 24px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 18 }}>{step.emoji}</span>
              <Input
                placeholder={step.placeholder}
                value={values[currentStep]}
                onChange={(e) => setters[currentStep](e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  borderRadius: SCOUT_RADIUS.pill,
                  fontSize: 13,
                  height: 38,
                  border: `1.5px solid ${T.border}`,
                  fontFamily: SCOUT_FONTS.body,
                }}
              />
              {isLastStep && allComplete && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleGenerate}
                  loading={loading}
                  style={{
                    background: `linear-gradient(135deg, ${T.primary}, #e8a87c)`,
                    border: 'none',
                    borderRadius: SCOUT_RADIUS.pill,
                    fontSize: 13,
                    height: 38,
                    fontFamily: SCOUT_FONTS.heading,
                    fontWeight: 600,
                    paddingLeft: 20,
                    paddingRight: 20,
                  }}
                >
                  洞察
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ─── 封面故事卡 ────────────────────────────────────────

  const renderCoverStory = () => {
    if (!data) return null;
    return (
      <div
        className="scout-fade-in-up scout-stagger-1"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: SCOUT_RADIUS.lg,
          boxShadow: SCOUT_SHADOWS.trendCard,
          padding: '28px 24px',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          backgroundImage: SCOUT_TEXTURES.paperGrain,
          backgroundBlendMode: 'overlay',
        }}
      >
        {/* 左侧热度仪表 */}
        <div style={{ flexShrink: 0 }}>
          <HeatGauge
            score={data.heatScore}
            label={data.heatLabel}
            size={160}
            textColor={T.text}
            trackColor={`${T.border}66`}
          />
        </div>
        {/* 右侧标题区 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 3,
            color: T.primary,
            fontFamily: SCOUT_FONTS.heading,
            textTransform: 'uppercase',
            marginBottom: 8,
            opacity: 0.8,
          }}>
            TREND INSIGHT REPORT
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 700,
            color: T.text,
            fontFamily: SCOUT_FONTS.heading,
            lineHeight: 1.3,
            marginBottom: 6,
          }}>
            {field ? `${field} 趋势洞察` : 'AI 行业趋势洞察'}
          </div>
          <div style={{
            fontSize: 13,
            color: T.textSecondary,
            fontFamily: SCOUT_FONTS.body,
            lineHeight: 1.5,
          }}>
            {timeRange || '2024 - 2026'} | 关注重点：{focus || '技术突破、市场格局'}
          </div>
          <div style={{
            marginTop: 12,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            {showDemo && (
              <Tag style={{
                background: `${T.accent}18`,
                border: `1px solid ${T.accent}40`,
                color: T.accent,
                borderRadius: SCOUT_RADIUS.pill,
                fontSize: 11,
                fontFamily: SCOUT_FONTS.body,
                padding: '1px 10px',
                margin: 0,
                fontWeight: 600,
              }}>
                示例报告
              </Tag>
            )}
            <Tag style={{
              background: `${T.primary}10`,
              border: `1px solid ${T.primary}30`,
              color: T.primary,
              borderRadius: SCOUT_RADIUS.pill,
              fontSize: 11,
              fontFamily: SCOUT_FONTS.body,
              padding: '1px 10px',
              margin: 0,
            }}>
              热度 {data.heatScore}
            </Tag>
            <Tag style={{
              background: `${T.secondary}10`,
              border: `1px solid ${T.secondary}30`,
              color: T.secondary,
              borderRadius: SCOUT_RADIUS.pill,
              fontSize: 11,
              fontFamily: SCOUT_FONTS.body,
              padding: '1px 10px',
              margin: 0,
            }}>
              {data.heatLabel}
            </Tag>
            <Tag style={{
              background: `${T.accent}10`,
              border: `1px solid ${T.accent}30`,
              color: T.accent,
              borderRadius: SCOUT_RADIUS.pill,
              fontSize: 11,
              fontFamily: SCOUT_FONTS.body,
              padding: '1px 10px',
              margin: 0,
            }}>
              {data.timeline.length} 个事件
            </Tag>
          </div>
        </div>
      </div>
    );
  };

  // ─── 不对称双列：时间轴 + 趋势曲线 ────────────────────

  const renderDualColumns = () => {
    if (!data) return null;

    const trendSeries = data.paths.series.map((s, i) => ({
      name: s.name,
      data: s.data,
      color: T.chartColors[i % T.chartColors.length],
    }));

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.3fr',
        gap: 16,
      }}>
        {/* 左列：垂直时间轴 */}
        <div
          className="scout-fade-in-up scout-stagger-2"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: SCOUT_RADIUS.lg,
            boxShadow: SCOUT_SHADOWS.trendCard,
            padding: '18px 14px',
            overflow: 'hidden',
          }}
        >
          <ScoutSectionHeader
            title="趋势时间轴"
            icon="📅"
            color={T.primary}
            subtitle="TIMELINE"
          />
          <TimelineChart
            events={data.timeline}
            lineColor={T.border}
            nodeColors={{ high: T.primary, medium: T.secondary, low: T.accent }}
            textColor={T.text}
          />
        </div>

        {/* 右列：趋势曲线 */}
        <div
          className="scout-fade-in-up scout-stagger-3"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: SCOUT_RADIUS.lg,
            boxShadow: SCOUT_SHADOWS.trendCard,
            padding: '18px 14px',
          }}
        >
          <ScoutSectionHeader
            title="发展路径预测"
            icon="📈"
            color={T.secondary}
            subtitle="TREND CURVE"
          />
          {data.paths.series.length > 0 ? (
            <TrendCurve
              labels={data.paths.labels}
              series={trendSeries}
              textColor={T.text}
              gridColor={T.border}
            />
          ) : (
            <div style={{
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.textSecondary,
              fontSize: 13,
              fontFamily: SCOUT_FONTS.body,
            }}>
              暂无路径数据
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── 标签云 ────────────────────────────────────────────

  const renderTagCloud = () => {
    if (!data || data.tags.length === 0) return null;

    return (
      <div
        className="scout-fade-in-up scout-stagger-4"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: SCOUT_RADIUS.lg,
          boxShadow: SCOUT_SHADOWS.trendCard,
          padding: '20px 20px 16px',
        }}
      >
        <ScoutSectionHeader
          title="趋势关键词"
          icon="🏷️"
          color={T.accent}
          subtitle="KEYWORDS"
        />
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 4,
        }}>
          {data.tags.map((tag, i) => {
            const fontSize = 11 + tag.weight * 16;
            const color = CATEGORY_COLORS[tag.category] || T.primary;
            return (
              <span
                key={i}
                className={`scout-fade-in-scale scout-stagger-${Math.min(i + 1, 8)}`}
                style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: SCOUT_RADIUS.pill,
                  background: `${color}10`,
                  border: `1px solid ${color}28`,
                  color: color,
                  fontSize,
                  fontWeight: tag.weight > 0.7 ? 600 : 400,
                  fontFamily: SCOUT_FONTS.body,
                  cursor: 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  lineHeight: 1.6,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.08)';
                  (e.target as HTMLElement).style.boxShadow = `0 2px 10px ${color}18`;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                  (e.target as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {tag.text}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── 深度分析区 ────────────────────────────────────────

  const renderDeepAnalysis = () => {
    if (!data || !data.analysis) return null;

    return (
      <div
        className="scout-fade-in-up scout-stagger-5"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: SCOUT_RADIUS.lg,
          boxShadow: SCOUT_SHADOWS.trendCard,
          padding: '24px 24px 20px',
          position: 'relative',
        }}
      >
        {/* 顶部标签栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 3,
              color: T.primary,
              fontFamily: SCOUT_FONTS.heading,
              textTransform: 'uppercase',
            }}>
              DEEP ANALYSIS
            </span>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: T.primary,
              opacity: 0.5,
            }} />
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.text,
              fontFamily: SCOUT_FONTS.heading,
            }}>
              深度分析
            </span>
          </div>
          <Tooltip title="导出 Markdown">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{
                color: T.textSecondary,
                fontSize: 13,
                border: 'none',
              }}
            />
          </Tooltip>
        </div>
        {/* 杂志双栏排版 */}
        <Paragraph
          style={{
            color: T.text,
            fontSize: 14,
            fontFamily: SCOUT_FONTS.body,
            lineHeight: 2,
            whiteSpace: 'pre-wrap',
            margin: 0,
            letterSpacing: 0.3,
            columnCount: 2,
            columnGap: 28,
            columnRule: `1px solid ${T.border}`,
            textAlign: 'justify',
          }}
        >
          {cleanMarkdown(data.analysis)}
        </Paragraph>
      </div>
    );
  };

  // ─── 降级渲染（JSON 解析失败） ─────────────────────────

  const renderFallback = () => {
    if (!rawText || data) return null;

    return (
      <div
        className="scout-fade-in-up"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: SCOUT_RADIUS.lg,
          boxShadow: SCOUT_SHADOWS.trendCard,
          padding: 24,
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 3,
              color: T.primary,
              fontFamily: SCOUT_FONTS.heading,
              textTransform: 'uppercase',
            }}>
              TREND INSIGHT REPORT
            </span>
          </div>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            style={{ color: T.textSecondary, border: 'none' }}
          />
        </div>
        <Text style={{
          color: T.text,
          whiteSpace: 'pre-wrap',
          fontFamily: SCOUT_FONTS.body,
          lineHeight: 1.9,
          fontSize: 14,
        }}>
          {cleanMarkdown(rawText)}
        </Text>
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <Button
            type="default"
            size="small"
            onClick={handleLoadDemo}
            style={{
              borderRadius: SCOUT_RADIUS.pill,
              border: `1px solid ${T.primary}40`,
              color: T.primary,
              background: `${T.primary}08`,
              fontSize: 12,
              fontFamily: SCOUT_FONTS.body,
            }}
          >
            返回查看示例报告
          </Button>
        </div>
      </div>
    );
  };

  // ─── 主渲染 ────────────────────────────────────────────
  // ─── 区域3：热度分布环形图 + 关键词标签云 ─────────────

  const renderDistributionAndTags = () => {
    if (!data) return null;

    const donutSlices: DonutSlice[] = (data.distribution || []).map((d, i) => ({
      label: d.label,
      value: d.value,
      color: T.chartColors[i % T.chartColors.length],
    }));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16 }}>
        {/* 左：热度分布环形图 */}
        <div
          className="scout-fade-in-up scout-stagger-4"
          style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: SCOUT_RADIUS.lg, boxShadow: SCOUT_SHADOWS.trendCard,
            padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          <ScoutSectionHeader title="热度分布" icon="🥧" color={T.accent} subtitle="DISTRIBUTION" />
          {donutSlices.length > 0 ? (
            <DonutChart
              slices={donutSlices}
              size={150}
              thickness={16}
              centerLabel="维度"
              centerValue={String(donutSlices.length)}
              textColor={T.text}
            />
          ) : (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSecondary, fontSize: 12, fontFamily: SCOUT_FONTS.body }}>暂无分布数据</div>
          )}
        </div>

        {/* 右：关键词标签云 */}
        <div
          className="scout-fade-in-up scout-stagger-5"
          style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: SCOUT_RADIUS.lg, boxShadow: SCOUT_SHADOWS.trendCard,
            padding: '18px 16px',
          }}
        >
          <ScoutSectionHeader title="趋势关键词" icon="🏷️" color={T.accent} subtitle="KEYWORDS" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
            {data.tags.map((tag, i) => {
              const fontSize = 11 + tag.weight * 16;
              const color = CATEGORY_COLORS[tag.category] || T.primary;
              return (
                <span
                  key={i}
                  className={`scout-fade-in-scale scout-stagger-${Math.min(i + 1, 8)}`}
                  style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: SCOUT_RADIUS.pill,
                    background: `${color}10`, border: `1px solid ${color}28`, color,
                    fontSize, fontWeight: tag.weight > 0.7 ? 600 : 400, fontFamily: SCOUT_FONTS.body,
                    cursor: 'default', transition: 'transform 0.2s, box-shadow 0.2s', lineHeight: 1.6,
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.08)'; (e.target as HTMLElement).style.boxShadow = `0 2px 10px ${color}18`; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; (e.target as HTMLElement).style.boxShadow = 'none'; }}
                >{tag.text}</span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── 区域4：增长曲线面积图 ────────────────────────────

  const renderGrowthCurve = () => {
    if (!data || !data.growth) return null;

    const hasGrowth = data.growth.labels.length > 0 && data.growth.current.length > 0;
    if (!hasGrowth) return null;

    const growthSeries = [
      { name: '当前增长', data: data.growth.current, color: T.primary },
      { name: '预测增长', data: data.growth.projected, color: T.secondary },
    ];

    return (
      <div
        className="scout-fade-in-up scout-stagger-6"
        style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: SCOUT_RADIUS.lg, boxShadow: SCOUT_SHADOWS.trendCard,
          padding: '18px 14px',
        }}
      >
        <ScoutSectionHeader title="增长趋势对比" icon="📊" color={T.primary} subtitle="GROWTH CURVE" />
        <AreaChart
          labels={data.growth.labels}
          series={growthSeries}
          textColor={T.text}
          gridColor={T.border}
          height={200}
        />
        {/* 图例 */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
          {growthSeries.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, boxShadow: `0 0 4px ${s.color}44` }} />
              <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: SCOUT_FONTS.body }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── 主渲染 ────────────────────────────────────────────

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        backgroundImage: SCOUT_TEXTURES.paperGrain,
        backgroundBlendMode: 'overlay',
        color: T.text,
        overflow: 'hidden',
      }}
    >
      {/* 步骤式引导输入区 */}
      {renderInputArea()}

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {/* 加载态 */}
        {loading && (
          <div style={{ paddingTop: 24 }}>
            <ScoutLoadingSkeleton
              rows={5}
              chartType="grid"
              surfaceColor={T.surface}
              shimmerColor={T.bg}
            />
          </div>
        )}

        {/* 数据态：杂志排版 */}
        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 数据源工具条 */}
            <div
              className="scout-fade-in-up"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 16px',
                background: showDemo ? `${T.accent}08` : `${T.primary}06`,
                border: `1px solid ${showDemo ? `${T.accent}28` : `${T.primary}22`}`,
                borderRadius: SCOUT_RADIUS.lg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: showDemo ? T.accent : T.primary,
                  boxShadow: `0 0 6px ${showDemo ? T.accent : T.primary}66`,
                  flexShrink: 0,
                }} />
                <Text style={{
                  color: T.text,
                  fontSize: 12,
                  fontFamily: SCOUT_FONTS.body,
                }}>
                  {showDemo ? '当前展示示例报告 — 在上方输入领域并点击「洞察」，生成专属趋势分析' : 'AI 生成报告'}
                </Text>
              </div>
              {!showDemo && (
                <Button
                  type="text"
                  size="small"
                  onClick={handleLoadDemo}
                  style={{
                    color: T.textSecondary,
                    fontSize: 12,
                    fontFamily: SCOUT_FONTS.body,
                    border: 'none',
                  }}
                >
                  恢复示例
                </Button>
              )}
            </div>

            {/* 封面故事卡 */}
            {renderCoverStory()}
            {/* 不对称双列 */}
            {renderDualColumns()}
            {/* 热度分布 + 标签云 */}
            {renderDistributionAndTags()}
            {/* 增长曲线 */}
            {renderGrowthCurve()}
            {/* 深度分析 */}
            {renderDeepAnalysis()}
          </div>
        )}

        {/* 降级 */}
        {!loading && renderFallback()}

        {/* 空状态（仅当示例加载失败时出现） */}
        {!loading && !data && !rawText && (
          <ScoutEmptyState
            scene={<EmptyScene />}
            title="趋势洞察引擎"
            subtitle="探索行业趋势，洞察未来发展方向"
            hint="按步骤填写，或直接输入开始探索"
            textColor={T.text}
            subColor={T.textSecondary}
          />
        )}
      </div>
    </div>
  );
};

export default TrendInsight;
