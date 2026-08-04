/**
 * 机会评估面板 - 极简评估终端（分区式卡片布局）
 * 纯黑背景 + 绿色主调
 * 五大分区：综合评分 / 风险矩阵+市场漏斗 / 可行性维度 / 资源匹配+SWOT / 评估报告
 */

import React, { useState, useCallback } from 'react';
import { Input, Button, Typography, Tooltip } from 'antd';
import { SendOutlined, DownloadOutlined } from '@ant-design/icons';
import { chatWithZhipu } from '../../services/aiService';
import {
  SCOUT_PALETTE,
  SCOUT_FONTS,
  SCOUT_RADIUS,
  SCOUT_GRADIENTS,
  SCOUT_SHADOWS,
} from './scout-theme';
import './scout-animations.css';
import ScoutEmptyState from './shared/ScoutEmptyState';
import ScoutSectionHeader from './shared/ScoutSectionHeader';
import ScoutLoadingSkeleton from './shared/ScoutLoadingSkeleton';
import GaugeChart from './svg/GaugeChart';
import type { RadarSeries } from './svg/RadarChart';
import FunnelChart from './svg/FunnelChart';
import type { FunnelLayer } from './svg/FunnelChart';
import ProgressRing from './svg/ProgressRing';
import DonutChart from './svg/DonutChart';
import type { DonutSlice } from './svg/DonutChart';
import BarChart from './svg/BarChart';
import type { BarItem } from './svg/BarChart';

const { Text, Paragraph } = Typography;
const T = SCOUT_PALETTE.opportunity;

// ─── 数据结构 ─────────────────────────────────────────────

interface OpportunityData {
  overallScore: number;
  scoreLabel: string;
  risks: { name: string; probability: number; impact: number; level: string }[];
  market: {
    tam: string;
    sam: string;
    som: string;
    tamValue: number;
    samValue: number;
    somValue: number;
  };
  feasibility: Record<string, number>;
  analysis: string;
  swot?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  resourceMatch?: { label: string; value: number }[];
}

// ─── JSON 解析 ────────────────────────────────────────────

function parseOpportunityResponse(raw: string): OpportunityData | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.overallScore !== undefined && parsed.feasibility) {
      if (!parsed.swot) {
        parsed.swot = {
          strengths: ['团队经验丰富', '技术方案成熟'],
          weaknesses: ['资金有限', '品牌知名度低'],
          opportunities: ['市场需求增长', '政策支持'],
          threats: ['竞争加剧', '技术变革快'],
        };
      }
      if (!parsed.resourceMatch) {
        parsed.resourceMatch = [
          { label: '资金', value: 6 },
          { label: '团队', value: 8 },
          { label: '技术', value: 7 },
          { label: '渠道', value: 5 },
        ];
      }
      return parsed as OpportunityData;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── 系统提示词 ───────────────────────────────────────────

const SYSTEM_PROMPT = `你是一位创业机会评估专家。请根据提供的信息，进行全面机会评估。

请严格按以下 JSON 格式输出（不要输出其他内容，不要使用 markdown 代码块包裹）：
{
  "overallScore": 72,
  "scoreLabel": "值得尝试",
  "risks": [
    { "name": "市场风险", "probability": 0.6, "impact": 0.8, "level": "high" },
    { "name": "技术风险", "probability": 0.3, "impact": 0.5, "level": "medium" },
    { "name": "团队风险", "probability": 0.2, "impact": 0.4, "level": "low" },
    { "name": "资金风险", "probability": 0.5, "impact": 0.7, "level": "medium" }
  ],
  "market": {
    "tam": "1000亿", "sam": "200亿", "som": "20亿",
    "tamValue": 1000, "samValue": 200, "somValue": 20
  },
  "feasibility": {
    "市场吸引力": 8, "技术可行性": 7, "商业模式": 6, "团队匹配": 9, "财务健康": 5
  },
  "swot": {
    "strengths": ["优势1", "优势2"],
    "weaknesses": ["劣势1", "劣势2"],
    "opportunities": ["机会1", "机会2"],
    "threats": ["威胁1", "威胁2"]
  },
  "resourceMatch": [
    { "label": "资金", "value": 6 },
    { "label": "团队", "value": 8 },
    { "label": "技术", "value": 7 },
    { "label": "渠道", "value": 5 }
  ],
  "analysis": "## 评估总结\\n详细的评估分析文字..."
}`;

// ─── Markdown 清理：移除标题符号 #，保留正文 ─────────────

const cleanMarkdown = (text: string): string => text.replace(/^#{1,6}\s*/gm, '');

const RiskScatter: React.FC<{
  risks: OpportunityData['risks'];
}> = ({ risks }) => {
  const svgW = 280;
  const svgH = 220;
  const pad = 40;

  const levelColors: Record<string, string> = {
    high: '#ff6b6b',
    medium: '#faad14',
    low: '#788c5d',
  };

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {/* 坐标轴 */}
      <line x1={pad} y1={svgH - pad} x2={svgW - 10} y2={svgH - pad} stroke={T.border} strokeWidth={1} />
      <line x1={pad} y1={10} x2={pad} y2={svgH - pad} stroke={T.border} strokeWidth={1} />
      {/* 网格线 */}
      {[0.25, 0.5, 0.75].map((v) => (
        <React.Fragment key={v}>
          <line
            x1={pad} y1={svgH - pad - v * (svgH - pad - 10)}
            x2={svgW - 10} y2={svgH - pad - v * (svgH - pad - 10)}
            stroke={T.border} strokeWidth={0.5} strokeDasharray="3 3"
          />
          <line
            x1={pad + v * (svgW - pad - 10)} y1={10}
            x2={pad + v * (svgW - pad - 10)} y2={svgH - pad}
            stroke={T.border} strokeWidth={0.5} strokeDasharray="3 3"
          />
        </React.Fragment>
      ))}
      {/* 轴标签 */}
      <text x={svgW / 2} y={svgH - 6} textAnchor="middle" fill={T.textSecondary} fontSize={10}>
        发生概率 →
      </text>
      <text
        x={10} y={svgH / 2} textAnchor="middle" fill={T.textSecondary} fontSize={10}
        transform={`rotate(-90, 10, ${svgH / 2})`}
      >
        影响程度 →
      </text>

      {/* 风险散点 */}
      {risks.map((risk, i) => {
        const px = pad + risk.probability * (svgW - pad - 10);
        const py = svgH - pad - risk.impact * (svgH - pad - 10);
        const color = levelColors[risk.level] || levelColors.medium;
        return (
          <g key={i} className={`scout-fade-in-scale scout-stagger-${i + 1}`}>
            <circle
              cx={px} cy={py} r={12}
              fill={color} fillOpacity={0.2}
              stroke={color} strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
            />
            <text x={px} y={py + 3} textAnchor="middle" fill={color} fontSize={9} fontWeight={600}>
              {risk.name.slice(0, 2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── 空状态 SVG 场景：终端窗口 ────────────────────────────

const TerminalScene: React.FC = () => (
  <svg width={180} height={130} viewBox="0 0 180 130">
    {/* 窗口主体 */}
    <rect x={10} y={10} width={160} height={110} rx={8} fill={T.surface} stroke={T.border} strokeWidth={1} />
    {/* 标题栏 */}
    <rect x={10} y={10} width={160} height={24} rx={8} fill={T.surface} />
    <rect x={10} y={26} width={160} height={8} fill={T.surface} />
    <line x1={10} y1={34} x2={170} y2={34} stroke={T.border} strokeWidth={0.5} />
    {/* 红黄绿按钮 */}
    <circle cx={26} cy={22} r={4} fill="#ff5f57" />
    <circle cx={38} cy={22} r={4} fill="#febc2e" />
    <circle cx={50} cy={22} r={4} fill="#28c840" />
    {/* 终端文字 */}
    <text x={22} y={52} fill={T.primary} fontSize={9} fontFamily={SCOUT_FONTS.mono}>
      {'> '}opportunity_eval
    </text>
    <text x={22} y={66} fill={T.textSecondary} fontSize={9} fontFamily={SCOUT_FONTS.mono}>
      loading modules...
    </text>
    <text x={22} y={80} fill={T.primary} fontSize={9} fontFamily={SCOUT_FONTS.mono}>
      {'> '}awaiting input_
    </text>
    {/* 闪烁光标 */}
    <rect x={115} y={72} width={7} height={11} fill={T.primary}>
      <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
    </rect>
    {/* 底部装饰线 */}
    <line x1={22} y1={96} x2={158} y2={96} stroke={T.border} strokeWidth={0.5} strokeDasharray="2 4" />
    <text x={22} y={108} fill={T.textSecondary} fontSize={8} fontFamily={SCOUT_FONTS.mono} opacity={0.5}>
      v1.0.0 | 青宸智汇 Scout
    </text>
  </svg>
);

// ─── 示例数据（空状态预览用） ─────────────────────────────

const DEMO_DATA: OpportunityData = {
  overallScore: 72,
  scoreLabel: '值得尝试',
  risks: [
    { name: '市场风险', probability: 0.6, impact: 0.8, level: 'high' },
    { name: '技术风险', probability: 0.3, impact: 0.5, level: 'medium' },
    { name: '团队风险', probability: 0.2, impact: 0.4, level: 'low' },
    { name: '资金风险', probability: 0.5, impact: 0.7, level: 'medium' },
  ],
  market: {
    tam: '1000亿', sam: '200亿', som: '20亿',
    tamValue: 1000, samValue: 200, somValue: 20,
  },
  feasibility: {
    '市场吸引力': 8, '技术可行性': 7, '商业模式': 6, '团队匹配': 9, '财务健康': 5,
  },
  swot: {
    strengths: ['核心团队具备 5 年行业经验', '自研算法技术壁垒显著'],
    weaknesses: ['初始资金有限', '品牌知名度不足'],
    opportunities: ['AI 教育市场需求快速增长', '政策鼓励大学生创业'],
    threats: ['头部厂商进入细分市场', '技术迭代速度快'],
  },
  resourceMatch: [
    { label: '资金', value: 6 },
    { label: '团队', value: 8 },
    { label: '技术', value: 7 },
    { label: '渠道', value: 5 },
  ],
  analysis: `评估总结

一、市场机会
目标市场正处于高速增长期，TAM 达 1000 亿元规模。当前进入窗口期较好，头部厂商尚未形成垄断，细分场景仍存在明显空白。

二、核心风险
主要风险集中在市场与资金层面：市场教育成本较高，且初期现金流压力较大。建议通过最小可行产品（MVP）快速验证需求，降低市场不确定性。

三、可行性判断
团队匹配度与市场吸引力得分最高，技术方案成熟度中等。整体综合评分 72 分，属于"值得尝试"级别，建议以轻资产模式启动。

四、行动建议
1. 前 3 个月聚焦单一场景，完成 MVP 验证
2. 借助高校资源与政策补贴降低启动成本
3. 建立种子用户社群，积累早期口碑`,
};

// ─── 主组件 ───────────────────────────────────────────────

const OpportunityEval: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [market, setMarket] = useState('');
  const [advantage, setAdvantage] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OpportunityData | null>(null);
  const [rawText, setRawText] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!idea || !market || !advantage) return;
    setLoading(true);
    setData(null);
    setRawText('');

    const userContent = `创业想法: ${idea}\n目标市场: ${market}\n核心优势: ${advantage}`;

    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: userContent }],
        { system_prompt: SYSTEM_PROMPT }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      setRawText(content);

      const parsed = parseOpportunityResponse(content);
      if (parsed) setData(parsed);
    } catch {
      setRawText('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [idea, market, advantage]);

  const handleLoadDemo = useCallback(() => {
    setData(DEMO_DATA);
    setRawText(DEMO_DATA.analysis);
  }, []);

  const handleDownload = () => {
    const blob = new Blob([rawText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '机会评估报告.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── 漏斗数据 ────────────────────────────────────────

  const funnelLayers: FunnelLayer[] = data
    ? [
        { label: 'TAM 总可达市场', value: data.market.tamValue, displayValue: data.market.tam, color: T.primary },
        { label: 'SAM 可服务市场', value: data.market.samValue, displayValue: data.market.sam, color: T.secondary },
        { label: 'SOM 可获得市场', value: data.market.somValue, displayValue: data.market.som, color: T.accent },
      ]
    : [];

  // ─── 可行性维度 ──────────────────────────────────────

  const feasibilityDimensions = data ? Object.keys(data.feasibility) : [];
  const feasibilitySeries: RadarSeries[] = data
    ? [
        {
          name: '可行性',
          values: Object.values(data.feasibility),
          color: T.primary,
        },
      ]
    : [];

  // ─── 渲染 ────────────────────────────────────────────

  const canEvaluate = idea.trim() && market.trim() && advantage.trim();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        color: T.text,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ─── 1. 终端风格输入区 ─────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ position: 'relative', padding: '14px 20px 16px' }}>
          {/* 行1: 创业想法 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              color: T.primary,
              fontFamily: SCOUT_FONTS.mono,
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {'>'}
            </span>
            <span style={{
              color: T.textSecondary,
              fontFamily: SCOUT_FONTS.mono,
              fontSize: 12,
              flexShrink: 0,
              minWidth: 68,
            }}>
              创业想法
            </span>
            <Input
              variant="borderless"
              placeholder="描述你的核心价值主张..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              style={{
                background: 'transparent',
                color: T.text,
                fontFamily: SCOUT_FONTS.mono,
                fontSize: 13,
                padding: '2px 0',
              }}
            />
          </div>

          {/* 行2: 目标市场 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              color: T.primary,
              fontFamily: SCOUT_FONTS.mono,
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {'>'}
            </span>
            <span style={{
              color: T.textSecondary,
              fontFamily: SCOUT_FONTS.mono,
              fontSize: 12,
              flexShrink: 0,
              minWidth: 68,
            }}>
              目标市场
            </span>
            <Input
              variant="borderless"
              placeholder="目标市场规模与特点..."
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              style={{
                background: 'transparent',
                color: T.text,
                fontFamily: SCOUT_FONTS.mono,
                fontSize: 13,
                padding: '2px 0',
              }}
            />
          </div>

          {/* 行3: 核心优势 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              color: T.primary,
              fontFamily: SCOUT_FONTS.mono,
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {'>'}
            </span>
            <span style={{
              color: T.textSecondary,
              fontFamily: SCOUT_FONTS.mono,
              fontSize: 12,
              flexShrink: 0,
              minWidth: 68,
            }}>
              核心优势
            </span>
            <Input
              variant="borderless"
              placeholder="你的核心竞争优势..."
              value={advantage}
              onChange={(e) => setAdvantage(e.target.value)}
              style={{
                background: 'transparent',
                color: T.text,
                fontFamily: SCOUT_FONTS.mono,
                fontSize: 13,
                padding: '2px 0',
              }}
            />
          </div>

          {/* 底部: 评估按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              disabled={!canEvaluate}
              style={{
                background: canEvaluate
                  ? `linear-gradient(135deg, ${T.primary}, #a3b88c)`
                  : `${T.border}`,
                border: 'none',
                borderRadius: SCOUT_RADIUS.sm,
                fontFamily: SCOUT_FONTS.mono,
                fontSize: 12,
                fontWeight: 600,
                height: 32,
                letterSpacing: 0.5,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SendOutlined style={{ fontSize: 11 }} />
                $ evaluate --run
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 内容区 ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

        {/* ─── 2. 空状态 ─────────────────────────────────── */}
        {!loading && !data && !rawText && (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <ScoutEmptyState
              scene={<TerminalScene />}
              title="机会评估终端"
              subtitle="输入创业信息，启动 AI 驱动的机会评估引擎"
              hint="v1.0.0 - powered by 青宸智汇"
              textColor={T.text}
              subColor={T.textSecondary}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleLoadDemo}
              style={{
                background: `linear-gradient(135deg, ${T.primary}, #a3b88c)`,
                border: 'none',
                borderRadius: SCOUT_RADIUS.sm,
                fontFamily: SCOUT_FONTS.mono,
                fontSize: 12,
                fontWeight: 600,
                height: 34,
                letterSpacing: 0.5,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                $ demo --preview
              </span>
            </Button>
            <Text style={{
              color: T.textSecondary, fontSize: 11, marginTop: 10,
              fontFamily: SCOUT_FONTS.mono, opacity: 0.7,
            }}>
              无需等待 AI 生成，直接预览评估仪表盘布局
            </Text>
          </div>
        )}

        {/* ─── 3. 加载态 ─────────────────────────────────── */}
        {loading && (
          <div style={{ padding: 16 }}>
            <ScoutLoadingSkeleton
              rows={4}
              chartType="gauge"
              surfaceColor={T.surface}
              shimmerColor={T.border}
            />
          </div>
        )}

        {/* ─── 4. 数据态：终端仪表盘 ─────────────────────── */}
        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>

            {/* ── 综合评分大仪表 ─────────────────────────── */}
            <div
              className="scout-fade-in-up scout-stagger-1"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px 16px 16px',
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: SCOUT_RADIUS.md,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: SCOUT_SHADOWS.opportunityGlow,
              }}
            >
              {/* 背景辉光 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: SCOUT_GRADIENTS.opportunityGlow,
                  pointerEvents: 'none',
                }}
              />
              <ScoutSectionHeader
                title="综合评分"
                color={T.primary}
                subtitle="OVERALL SCORE"
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <GaugeChart
                  value={data.overallScore}
                  label={data.scoreLabel}
                  size={200}
                  textColor={T.text}
                  trackColor="rgba(0,0,0,0.06)"
                  colorStops={[
                    { threshold: 40, color: '#ff6b6b' },
                    { threshold: 60, color: '#faad14' },
                    { threshold: 100, color: T.primary },
                  ]}
                />
              </div>
            </div>

            {/* ── 2列布局：风险矩阵 + 市场漏斗 ──────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* 风险矩阵散点图 */}
              <div
                className="scout-fade-in-up scout-stagger-2"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <ScoutSectionHeader
                  title="风险矩阵"
                  color={T.primary}
                  subtitle="RISK MATRIX"
                />
                <RiskScatter risks={data.risks} />
                {/* 风险图例：小圆点 + 名称 */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {data.risks.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: r.level === 'high' ? '#ff6b6b' : r.level === 'medium' ? '#faad14' : '#788c5d',
                          boxShadow: `0 0 4px ${r.level === 'high' ? '#ff6b6b' : r.level === 'medium' ? '#faad14' : '#788c5d'}44`,
                        }}
                      />
                      <Text style={{
                        color: T.textSecondary,
                        fontSize: 10,
                        fontFamily: SCOUT_FONTS.mono,
                      }}>
                        {r.name}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>

              {/* 市场漏斗 TAM/SAM/SOM */}
              <div
                className="scout-fade-in-up scout-stagger-3"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <ScoutSectionHeader
                  title="市场规模"
                  color={T.primary}
                  subtitle="MARKET SIZE"
                />
                <FunnelChart
                  layers={funnelLayers}
                  width={260}
                  height={180}
                  textColor={T.text}
                />
              </div>
            </div>

            {/* ── 可行性维度：ProgressRing 网格 ──────────── */}
            <div
              className="scout-fade-in-up scout-stagger-4"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: SCOUT_RADIUS.md,
                padding: 16,
              }}
            >
              <ScoutSectionHeader
                title="可行性维度"
                color={T.primary}
                subtitle="FEASIBILITY"
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 4,
              }}>
                {feasibilityDimensions.map((dim, i) => (
                  <div key={dim} className={`scout-fade-in-scale scout-stagger-${i + 1}`}>
                    <ProgressRing
                      value={data.feasibility[dim]}
                      label={dim}
                      size={72}
                      color={T.chartColors[i % T.chartColors.length]}
                      trackColor="rgba(0,0,0,0.05)"
                      textColor={T.textSecondary}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── 资源匹配 + SWOT 分析 ──────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
              {/* 资源匹配柱图 */}
              <div
                className="scout-fade-in-up scout-stagger-5"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <ScoutSectionHeader
                  title="资源匹配度"
                  color={T.primary}
                  subtitle="RESOURCE MATCH"
                />
                {data.resourceMatch && data.resourceMatch.length > 0 ? (
                  <BarChart
                    items={data.resourceMatch.map((r, i): BarItem => ({
                      label: r.label,
                      value: r.value,
                      color: T.chartColors[i % T.chartColors.length],
                    }))}
                    maxValue={10}
                    textColor={T.text}
                    trackColor="rgba(0,0,0,0.05)"
                  />
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSecondary, fontSize: 12, fontFamily: SCOUT_FONTS.mono }}>暂无数据</div>
                )}
              </div>

              {/* SWOT 四象限卡片 */}
              <div
                className="scout-fade-in-up scout-stagger-6"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                }}
              >
                <ScoutSectionHeader
                  title="SWOT 分析"
                  color={T.primary}
                  subtitle="SWOT MATRIX"
                />
                {data.swot ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {([
                      { key: 'S', title: '优势', items: data.swot.strengths, color: '#52c41a' },
                      { key: 'W', title: '劣势', items: data.swot.weaknesses, color: '#faad14' },
                      { key: 'O', title: '机会', items: data.swot.opportunities, color: '#58a6ff' },
                      { key: 'T', title: '威胁', items: data.swot.threats, color: '#ff6b6b' },
                    ] as const).map((quad) => (
                      <div
                        key={quad.key}
                        className={`scout-fade-in-scale scout-stagger-${quad.key.charCodeAt(0) - 78}`}
                        style={{
                          background: `${quad.color}08`,
                          border: `1px solid ${quad.color}30`,
                          borderRadius: SCOUT_RADIUS.sm,
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: `${quad.color}20`, border: `1px solid ${quad.color}50`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, color: quad.color,
                            fontFamily: SCOUT_FONTS.mono,
                          }}>{quad.key}</div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: quad.color, fontFamily: SCOUT_FONTS.heading }}>{quad.title}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {quad.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                              <span style={{ color: quad.color, fontSize: 10, marginTop: 1, opacity: 0.6 }}>▸</span>
                              <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: SCOUT_FONTS.mono, lineHeight: 1.5 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSecondary, fontSize: 12, fontFamily: SCOUT_FONTS.mono }}>暂无 SWOT 数据</div>
                )}
              </div>
            </div>

            {/* ── 评估报告：终端风格 ─────────────────────── */}
            {data.analysis && (
              <div
                className="scout-fade-in-up scout-stagger-5"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                  boxShadow: `0 0 16px ${T.glow}`,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <ScoutSectionHeader
                    title="评估报告"
                    color={T.primary}
                    subtitle="EVALUATION REPORT"
                  />
                  <Tooltip title="导出 Markdown">
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      size="small"
                      style={{
                        color: T.primary,
                        fontFamily: SCOUT_FONTS.mono,
                        fontSize: 11,
                      }}
                    />
                  </Tooltip>
                </div>
                {/* 终端风格报告区 */}
                <div style={{
                  background: 'rgba(120,140,93,0.04)',
                  borderRadius: SCOUT_RADIUS.sm,
                  padding: '14px 16px',
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5f57' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#febc2e' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28c840' }} />
                    <span style={{
                      fontFamily: SCOUT_FONTS.mono,
                      fontSize: 10,
                      color: T.textSecondary,
                      marginLeft: 4,
                    }}>
                      evaluation_report.md
                    </span>
                  </div>
                  <Paragraph
                    style={{
                      color: T.text,
                      fontSize: 13,
                      fontFamily: SCOUT_FONTS.mono,
                      lineHeight: 1.9,
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                    }}
                  >
                    {cleanMarkdown(data.analysis)}
                  </Paragraph>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 降级：JSON 解析失败时展示原文 ─────────────── */}
        {!loading && !data && rawText && (
          <div
            className="scout-fade-in-up"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: SCOUT_RADIUS.md,
              padding: 20,
              margin: 16,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <span style={{
                color: T.primary,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: SCOUT_FONTS.mono,
              }}>
                {'>'} 机会评估报告
              </span>
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ color: T.textSecondary }}
              />
            </div>
            <Text style={{
              color: T.text,
              whiteSpace: 'pre-wrap',
              fontFamily: SCOUT_FONTS.mono,
              lineHeight: 1.8,
              fontSize: 13,
            }}>
              {cleanMarkdown(rawText)}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityEval;
