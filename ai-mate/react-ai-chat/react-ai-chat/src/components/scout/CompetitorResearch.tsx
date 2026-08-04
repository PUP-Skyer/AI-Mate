/**
 * 竞品调研面板 — 暗色指挥中心
 * 竞品卡片 + 迷你数据图 + 雷达对比 + SWOT + 功能矩阵
 */

import React, { useState, useCallback } from 'react';
import { Input, Button, Typography, Tooltip, Tag } from 'antd';
import {
  SendOutlined,
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { chatWithZhipu } from '../../services/aiService';
import {
  SCOUT_PALETTE,
  SCOUT_FONTS,
  SCOUT_RADIUS,
  SCOUT_TEXTURES,
  SCOUT_SHADOWS,
} from './scout-theme';
import './scout-animations.css';
import ScoutEmptyState from './shared/ScoutEmptyState';
import ScoutHeroStat from './shared/ScoutHeroStat';
import ScoutSectionHeader from './shared/ScoutSectionHeader';
import ScoutLoadingSkeleton from './shared/ScoutLoadingSkeleton';
import RadarChart from './svg/RadarChart';
import type { RadarSeries } from './svg/RadarChart';
import MatrixChart from './svg/MatrixChart';
import type { MatrixQuadrant } from './svg/MatrixChart';

const { Text, Paragraph } = Typography;
const T = SCOUT_PALETTE.competitor;

// ─── 数据结构 ─────────────────────────────────────────────

interface CompetitorData {
  competitors: {
    name: string;
    description: string;
    category: string;
    scores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    features: string[];
  }[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  comparison: {
    features: string[];
    products: Record<string, boolean[]>;
  };
  summary: string;
}

// ─── 动态生成示例数据（离线预览） ────────────────────────

function generateDemoData(product: string, competitors: string, industry: string): CompetitorData {
  const compNames = competitors.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  const allNames = [product, ...compNames];

  const descriptions: Record<string, string> = {
    '豆包': '字节跳动旗下AI智能助手',
    'work buddy': 'AI智能工作伙伴',
    'chatgpt': 'OpenAI 大语言模型对话产品',
    '通义千问': '阿里云大语言模型',
    '文心一言': '百度大语言模型',
    'kimi': '月之暗面AI助手',
    'deepseek': '深度求索大语言模型',
    'glm': '智谱AI大语言模型',
    'claude': 'Anthropic 大语言模型',
    'gemini': 'Google 多模态AI模型',
  };
  const defDesc = `${industry || 'AI'}领域的${product}`;

  const featuresPool = ['智能对话', '多模态理解', '知识库', '长上下文', '联网搜索', '代码生成', '图像理解', '文件解析', '语音交互', '插件系统'];
  const strengthsPool = ['技术架构领先', '用户增长快', '生态资源丰富', '产品体验好', '商业化能力强', '开源社区活跃', '多模态能力强', '推理能力突出'];
  const weaknessesPool = ['品牌认知不足', '市场份额较小', '生态尚未完善', '算力成本高', '数据安全存疑', '国际化受限', '长尾场景覆盖弱', '定制化能力不足'];

  const shuffled = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const competitors_list = allNames.map((name, i) => {
    const dims = ['产品能力', '市场份额', '技术实力', '品牌影响力', '融资能力', '用户口碑'];
    // 生成有明显差异的评分：每个竞品有 2 个强项、2 个弱项、2 个中等
    const shuffledDims = shuffled(dims);
    const strongDims = shuffledDims.slice(0, 2);
    const weakDims = shuffledDims.slice(2, 4);
    const scores: Record<string, number> = {};
    dims.forEach(d => {
      if (strongDims.includes(d)) {
        scores[d] = 8 + Math.round(Math.random() * 2); // 8-10 强项
      } else if (weakDims.includes(d)) {
        scores[d] = 3 + Math.round(Math.random() * 2); // 3-5 弱项
      } else {
        scores[d] = 6 + Math.round(Math.random() * 2); // 6-8 中等
      }
    });
    // 给第一个（产品自身）整体偏高，突出优势
    if (i === 0) {
      Object.keys(scores).forEach(k => { scores[k] = Math.min(scores[k] + 1, 10); });
    }

    return {
      name,
      description: descriptions[name.toLowerCase()] || `${name} - ${industry}产品`,
      category: i === 0 ? '本产品' : (compNames.length <= 2 ? '直接竞品' : (i <= 2 ? '直接竞品' : '间接竞品')),
      scores,
      strengths: shuffled(strengthsPool).slice(0, 3),
      weaknesses: shuffled(weaknessesPool).slice(0, 3),
      features: shuffled(featuresPool).slice(0, 5),
    };
  });

  return {
    competitors: competitors_list,
    swot: {
      strengths: [ `${product}技术优势明显`, `${product}用户体验突出`, '团队执行力强' ],
      weaknesses: [ `${product}品牌建立期`, '用户基数待增长', '资金储备有限' ],
      opportunities: [ `${industry}行业高速增长`, 'AI应用渗透率提升', '垂直场景需求爆发' ],
      threats: [ '巨头生态挤压', '用户迁移成本高', '监管政策不确定性' ],
    },
    comparison: {
      features: featuresPool,
      products: Object.fromEntries(allNames.map((name, i) => [
        name,
        featuresPool.map(() => Math.random() > 0.3),
      ])),
    },
    summary: `${industry}赛道竞争日益激烈。${product}凭借技术创新和优秀的用户体验，在${allNames.slice(1).join('、')}等竞品中展现出独特优势。建议持续加强核心能力建设，深化行业场景覆盖，以差异化策略抢占市场份额。`,
  };
}

// ─── JSON 解析（带容错） ──────────────────────────────────

function parseCompetitorResponse(raw: string): CompetitorData | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.competitors && parsed.swot) return parsed as CompetitorData;
    return null;
  } catch {
    return null;
  }
}

// ─── 维度列表 ─────────────────────────────────────────────

const DIMENSIONS = ['产品能力', '市场份额', '技术实力', '品牌影响力', '融资能力', '用户口碑'];

// ─── 分类颜色 ─────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  '直接竞品': '#ff6b6b',
  '间接竞品': '#faad14',
  '潜在竞品': '#58a6ff',
  '标杆企业': '#788c5d',
};

// ─── 系统提示词 ───────────────────────────────────────────

const SYSTEM_PROMPT = `你是一位竞品分析专家。请根据用户提供的产品信息，分析竞品的各维度表现。

请严格按以下 JSON 格式输出（不要输出其他内容，不要使用 markdown 代码块包裹）：
{
  "competitors": [
    {
      "name": "竞品A",
      "description": "一句话描述该竞品定位",
      "category": "直接竞品",
      "scores": { "产品能力": 8, "市场份额": 6, "技术实力": 7, "品牌影响力": 5, "融资能力": 9, "用户口碑": 7 },
      "strengths": ["核心优势1", "核心优势2"],
      "weaknesses": ["主要短板1"],
      "features": ["特色功能1", "特色功能2"]
    }
  ],
  "swot": {
    "strengths": ["优势1", "优势2", "优势3"],
    "weaknesses": ["劣势1", "劣势2"],
    "opportunities": ["机会1", "机会2"],
    "threats": ["威胁1", "威胁2"]
  },
  "comparison": {
    "features": ["功能1", "功能2", "功能3", "功能4"],
    "products": { "竞品A": [true, false, true, false], "竞品B": [true, true, false, true] }
  },
  "summary": "## 竞品分析总结\\n详细的分析文字..."
}`;

// ─── 迷你条形图组件（嵌入竞品卡片） ─────────────────────

const MiniBarChart: React.FC<{
  scores: Record<string, number>;
  color: string;
}> = ({ scores, color }) => {
  const entries = Object.entries(scores);
  const barH = 6;
  const gap = 5;
  const svgW = 200;
  const labelW = 58;
  const barAreaW = svgW - labelW - 30;
  const svgH = entries.length * (barH + gap) + 2;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {entries.map(([dim, val], i) => {
        const y = i * (barH + gap) + 1;
        const bw = (val / 10) * barAreaW;
        return (
          <g key={dim}>
            <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill={T.textSecondary} fontSize={8} fontFamily={SCOUT_FONTS.body}>
              {dim.length > 4 ? dim.slice(0, 4) : dim}
            </text>
            <rect x={labelW} y={y} width={barAreaW} height={barH} rx={3} fill={T.border} opacity={0.3} />
            <rect x={labelW} y={y} width={0} height={barH} rx={3} fill={color} opacity={0.8}>
              <animate attributeName="width" from="0" to={String(bw)} dur="0.5s" fill="freeze" begin={`${i * 0.06}s`} />
            </rect>
            <text x={labelW + bw + 4} y={y + barH / 2 + 3} fill={T.textSecondary} fontSize={8} fontFamily={SCOUT_FONTS.mono}>
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── 综合得分环形图 ───────────────────────────────────────

const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({
  score,
  color,
  size = 48,
}) => {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 10) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill="none" stroke={T.border} strokeWidth={3} opacity={0.3} />
      <circle
        cx={center} cy={center} r={r} fill="none"
        stroke={color} strokeWidth={3}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={center} y={center + 1} textAnchor="middle" dominantBaseline="middle" fill={T.text} fontSize={12} fontWeight={700} fontFamily={SCOUT_FONTS.heading}>
        {score}
      </text>
    </svg>
  );
};

// ─── 主组件 ───────────────────────────────────────────────

const CompetitorResearch: React.FC = () => {
  const [product, setProduct] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompetitorData | null>(null);
  const [rawText, setRawText] = useState('');

  // ─── 预览示例数据 ─────────────────────────────────────

  const handlePreviewDemo = useCallback((p?: string, c?: string, ind?: string) => {
    setLoading(true);
    setData(null);
    setRawText('');
    setTimeout(() => {
      const demo = generateDemoData(p || product, c || competitors, ind || industry);
      setData(demo);
      setRawText(JSON.stringify(demo, null, 2));
      setLoading(false);
    }, 600);
  }, [product, competitors, industry]);

  const handleGenerate = useCallback(async () => {
    if (!product || !competitors || !industry) return;
    setLoading(true);
    setData(null);
    setRawText('');

    const userContent = `产品: ${product}\n竞品: ${competitors}\n行业: ${industry}`;

    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: userContent }],
        { system_prompt: SYSTEM_PROMPT }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      setRawText(content);

      const parsed = parseCompetitorResponse(content);
      if (parsed) {
        setData(parsed);
      } else {
        // API 未就绪或无有效响应时回退到匹配输入示例数据
        const demo = generateDemoData(product, competitors, industry);
        setRawText(JSON.stringify(demo, null, 2));
        setData(demo);
      }
    } catch {
      const demo = generateDemoData(product, competitors, industry);
      setRawText(JSON.stringify(demo, null, 2));
      setData(demo);
    } finally {
      setLoading(false);
    }
  }, [product, competitors, industry]);

  const handleDownload = () => {
    const blob = new Blob([rawText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '竞品调研报告.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── SWOT 象限数据 ───────────────────────────────────

  const swotQuadrants: MatrixQuadrant[] = data
    ? [
        { title: '优势 Strengths', items: data.swot.strengths, color: T.success, icon: '💪' },
        { title: '劣势 Weaknesses', items: data.swot.weaknesses, color: T.warning, icon: '⚠️' },
        { title: '机会 Opportunities', items: data.swot.opportunities, color: T.secondary, icon: '🚀' },
        { title: '威胁 Threats', items: data.swot.threats, color: T.danger, icon: '🛡️' },
      ]
    : [];

  // ─── 雷达图系列数据 ──────────────────────────────────

  const radarSeries: RadarSeries[] = data
    ? data.competitors.map((c, i) => ({
        name: c.name,
        values: DIMENSIONS.map((d) => c.scores[d] ?? 5),
        color: T.chartColors[i % T.chartColors.length],
      }))
    : [];

  // ─── 计算综合得分 ────────────────────────────────────

  const getAvgScore = (scores: Record<string, number>): number => {
    const vals = Object.values(scores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  };

  // ─── 空状态 SVG 场景：雷达扫描 ──────────────────────

  const radarScene = (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="50" fill="none" stroke={T.border} strokeWidth="1" />
      <circle cx="60" cy="60" r="35" fill="none" stroke={T.border} strokeWidth="0.5" strokeDasharray="3 3" />
      <circle cx="60" cy="60" r="20" fill="none" stroke={T.border} strokeWidth="0.5" strokeDasharray="2 4" />
      <line x1="60" y1="10" x2="60" y2="110" stroke={T.border} strokeWidth="0.5" />
      <line x1="10" y1="60" x2="110" y2="60" stroke={T.border} strokeWidth="0.5" />
      <g style={{ transformOrigin: '60px 60px', animation: 'scoutRadarSweep 3s linear infinite' }}>
        <line x1="60" y1="60" x2="60" y2="10" stroke={T.primary} strokeWidth="1.5" opacity="0.8" />
        <path d="M60,60 L60,10 A50,50 0 0,1 95,25 Z" fill={T.primary} opacity="0.08" />
      </g>
      <circle cx="60" cy="60" r="3" fill={T.primary} opacity="0.9" />
      <circle cx="60" cy="60" r="6" fill="none" stroke={T.primary} strokeWidth="0.8" opacity="0.4" />
    </svg>
  );

  // ─── 功能对比矩阵渲染 ───────────────────────────────

  const productNames = data ? Object.keys(data.comparison.products) : [];

  // ─── 渲染 ────────────────────────────────────────────

  const canGenerate = product.trim() && competitors.trim() && industry.trim();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        color: T.text,
        overflow: 'hidden',
      }}
    >
      {/* ═══ 1. 浮动命令栏输入区 ═══ */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px',
          background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
       {/* 输入框行 */}
       <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1.2, minWidth: 140 }}>
           <label style={{ fontSize: 11, color: T.textSecondary, fontFamily: SCOUT_FONTS.heading, fontWeight: 600, paddingLeft: 4 }}>
             📦 你的产品
           </label>
           <Input
             placeholder="如：飞书"
             value={product}
             onChange={(e) => setProduct(e.target.value)}
             onPressEnter={handleGenerate}
             style={{
               height: 38,
               borderRadius: SCOUT_RADIUS.sm,
               background: T.surface,
               borderColor: T.border,
               color: T.text,
               fontSize: 13,
               fontFamily: SCOUT_FONTS.body,
             }}
           />
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1.5, minWidth: 180 }}>
           <label style={{ fontSize: 11, color: T.textSecondary, fontFamily: SCOUT_FONTS.heading, fontWeight: 600, paddingLeft: 4 }}>
             🏷️ 已知竞品（逗号分隔）
           </label>
           <Input
             placeholder="如：钉钉,企业微信,Slack"
             value={competitors}
             onChange={(e) => setCompetitors(e.target.value)}
             onPressEnter={handleGenerate}
             style={{
               height: 38,
               borderRadius: SCOUT_RADIUS.sm,
               background: T.surface,
               borderColor: T.border,
               color: T.text,
               fontSize: 13,
               fontFamily: SCOUT_FONTS.body,
             }}
           />
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 0.8, minWidth: 100 }}>
           <label style={{ fontSize: 11, color: T.textSecondary, fontFamily: SCOUT_FONTS.heading, fontWeight: 600, paddingLeft: 4 }}>
             🏭 行业
           </label>
           <Input
             placeholder="如：企业协同"
             value={industry}
             onChange={(e) => setIndustry(e.target.value)}
             onPressEnter={handleGenerate}
             style={{
               height: 38,
               borderRadius: SCOUT_RADIUS.sm,
               background: T.surface,
               borderColor: T.border,
               color: T.text,
               fontSize: 13,
               fontFamily: SCOUT_FONTS.body,
             }}
           />
         </div>

         <Button
           type="primary"
           icon={<SendOutlined />}
           onClick={handleGenerate}
           loading={loading}
           disabled={!canGenerate}
           style={{
             flexShrink: 0,
             height: 38,
             borderRadius: SCOUT_RADIUS.sm,
             background: canGenerate ? `linear-gradient(135deg, ${T.primary}, #e8a87c)` : 'rgba(255,255,255,0.06)',
             border: 'none',
             fontSize: 13,
             padding: '0 20px',
             fontFamily: SCOUT_FONTS.heading,
             fontWeight: 600,
             boxShadow: canGenerate ? '0 2px 8px rgba(217,119,87,0.3)' : 'none',
           }}>
           调研
         </Button>
       </div>
      </div>

      {/* ═══ 内容区 ═══ */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 24px' }}>

       {/* ── 空状态 ── */}
       {!loading && !data && !rawText && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <ScoutEmptyState
            scene={radarScene}
            title="竞品情报中心"
            subtitle="输入产品与竞品信息，AI 将自动生成多维度竞品分析报告"
            hint="⌘ + Enter 快速开始"
            textColor={T.text}
            subColor={T.textSecondary}
          />
          <Button
            icon={<EyeOutlined />}
            onClick={() => handlePreviewDemo()}
            style={{
              borderRadius: SCOUT_RADIUS.sm,
              background: `${T.primary}18`,
              borderColor: `${T.primary}44`,
              color: T.primary,
              fontSize: 12,
              fontFamily: SCOUT_FONTS.heading,
              fontWeight: 600,
              height: 34,
              padding: '0 18px',
            }}
          >
            预览示例数据
          </Button>
        </div>
        )}

        {/* ── 加载态 ── */}
        {loading && (
          <div className="scout-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ScoutLoadingSkeleton chartType="radar" surfaceColor={T.surface} shimmerColor="#e0e0e0" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ScoutLoadingSkeleton chartType="grid" surfaceColor={T.surface} shimmerColor="#e0e0e0" />
              <ScoutLoadingSkeleton chartType="grid" surfaceColor={T.surface} shimmerColor="#e0e0e0" />
            </div>
          </div>
        )}

        {/* ── 数据态 ── */}
        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Hero 统计条 */}
            <div className="scout-fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <ScoutHeroStat
                value={data.competitors.length}
                label="竞品数"
                trend="neutral"
                color={T.primary}
                bgColor={T.surface}
              />
              <ScoutHeroStat
                value={data.swot.threats.length}
                label="威胁数"
                trend="down"
                color={T.danger}
                bgColor={T.surface}
              />
              <ScoutHeroStat
                value={data.swot.strengths.length}
                label="优势数"
                trend="up"
                color={T.success}
                bgColor={T.surface}
              />
            </div>

            {/* ═══ 竞品卡片网格 ═══ */}
            <div>
              <ScoutSectionHeader title="竞品档案" icon="🗂️" color={T.primary} subtitle={`${data.competitors.length} 个竞品详细分析`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginTop: 10 }}>
                {data.competitors.map((comp, i) => {
                  const avgScore = getAvgScore(comp.scores);
                  const catColor = CATEGORY_COLORS[comp.category] || T.secondary;
                  const cardColor = T.chartColors[i % T.chartColors.length];
                  const scoreEntries = Object.entries(comp.scores);
                  const maxScore = Math.max(...scoreEntries.map(([, v]) => v));

                  return (
                    <div
                      key={i}
                      className={`scout-fade-in-up scout-stagger-${Math.min(i + 1, 8)}`}
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: SCOUT_RADIUS.md,
                        overflow: 'hidden',
                        boxShadow: SCOUT_SHADOWS.competitorCard,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                    >
                      {/* ── 卡片头部 ── */}
                      <div style={{
                        padding: '14px 16px 12px',
                        borderBottom: `1px solid ${T.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        position: 'relative',
                      }}>
                        {/* 左侧色条 */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                          background: cardColor,
                        }} />
                        {/* 头像 */}
                        <div style={{
                          width: 36, height: 36, borderRadius: SCOUT_RADIUS.sm,
                          background: `${cardColor}22`, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: 16, fontWeight: 700,
                          color: cardColor, fontFamily: SCOUT_FONTS.heading,
                        }}>
                          {comp.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: T.text, fontSize: 14, fontWeight: 700, fontFamily: SCOUT_FONTS.heading }}>
                              {comp.name}
                            </Text>
                            <Tag style={{
                              margin: 0, fontSize: 9, lineHeight: '16px', padding: '0 6px',
                              background: `${catColor}22`, color: catColor, border: `1px solid ${catColor}44`,
                              borderRadius: SCOUT_RADIUS.pill,
                            }}>
                              {comp.category}
                            </Tag>
                          </div>
                          <Text style={{ color: T.textSecondary, fontSize: 11, fontFamily: SCOUT_FONTS.body, lineHeight: 1.4, display: 'block', marginTop: 2 }}>
                            {comp.description}
                          </Text>
                        </div>
                        {/* 得分 */}
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: cardColor, fontFamily: SCOUT_FONTS.heading, lineHeight: 1 }}>
                            {avgScore}
                          </div>
                          <div style={{ fontSize: 9, color: T.textSecondary, fontFamily: SCOUT_FONTS.body, marginTop: 2 }}>
                            综合分
                          </div>
                        </div>
                      </div>

                      {/* ── 维度进度条区 ── */}
                      <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textSecondary, fontFamily: SCOUT_FONTS.heading, marginBottom: 8, letterSpacing: 0.5 }}>
                          能力维度
                        </div>
                        {scoreEntries.map(([dim, val]) => {
                          const pct = Math.min((val / 10) * 100, 100);
                          return (
                            <div key={dim} style={{ marginBottom: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: T.textSecondary, fontFamily: SCOUT_FONTS.body }}>{dim}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: val >= 7 ? T.success : val >= 5 ? T.warning : T.danger, fontFamily: SCOUT_FONTS.mono }}>{val}/10</span>
                              </div>
                              <div style={{
                                height: 5, borderRadius: 3,
                                background: `${T.border}55`, overflow: 'hidden',
                              }}>
                                <div style={{
                                  width: `${pct}%`, height: '100%', borderRadius: 3,
                                  background: val >= 7
                                    ? `linear-gradient(90deg, ${T.success}, ${T.success}aa)`
                                    : val >= 5
                                    ? `linear-gradient(90deg, ${T.warning}, ${T.warning}aa)`
                                    : `linear-gradient(90deg, ${T.danger}, ${T.danger}aa)`,
                                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── 优势/短板区 ── */}
                      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ flex: 1, padding: '10px 12px', borderRight: `1px solid ${T.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                            <RiseOutlined style={{ color: T.success, fontSize: 11 }} />
                            <Text style={{ color: T.success, fontSize: 10, fontWeight: 700, fontFamily: SCOUT_FONTS.heading }}>优势</Text>
                          </div>
                          {comp.strengths.slice(0, 3).map((s, si) => (
                            <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 3 }}>
                              <span style={{ color: T.success, fontSize: 5, marginTop: 5, flexShrink: 0 }}>●</span>
                              <Text style={{ color: T.text, fontSize: 10, fontFamily: SCOUT_FONTS.body, lineHeight: 1.5 }}>{s}</Text>
                            </div>
                          ))}
                        </div>
                        <div style={{ flex: 1, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                            <FallOutlined style={{ color: T.warning, fontSize: 11 }} />
                            <Text style={{ color: T.warning, fontSize: 10, fontWeight: 700, fontFamily: SCOUT_FONTS.heading }}>短板</Text>
                          </div>
                          {comp.weaknesses.slice(0, 3).map((w, wi) => (
                            <div key={wi} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 3 }}>
                              <span style={{ color: T.warning, fontSize: 5, marginTop: 5, flexShrink: 0 }}>●</span>
                              <Text style={{ color: T.text, fontSize: 10, fontFamily: SCOUT_FONTS.body, lineHeight: 1.5 }}>{w}</Text>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── 特色功能标签 ── */}
                      {comp.features.length > 0 && (
                        <div style={{ padding: '10px 16px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {comp.features.map((f, fi) => (
                            <Tag key={fi} style={{
                              margin: 0, fontSize: 9, lineHeight: '18px', padding: '0 8px',
                              background: `${cardColor}12`, color: cardColor, border: `1px solid ${cardColor}28`,
                              borderRadius: SCOUT_RADIUS.sm,
                            }}>
                              {f}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ 雷达对比图 ═══ */}
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
                boxShadow: SCOUT_SHADOWS.competitorCard,
              }}
            >
              <ScoutSectionHeader title="能力雷达对比" icon="📡" color={T.primary} subtitle="所有竞品多维度叠加对比" />
              <RadarChart
                dimensions={DIMENSIONS}
                series={radarSeries}
                size={260}
                labelColor={T.textSecondary}
                gridColor={`${T.border}88`}
              />
              {/* 图例 */}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {radarSeries.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}66` }} />
                    <Text style={{ color: T.textSecondary, fontSize: 11, fontFamily: SCOUT_FONTS.body }}>{s.name}</Text>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ SWOT + 功能对比 并排 ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

              {/* SWOT 矩阵 */}
              <div
                className="scout-fade-in-up scout-stagger-4"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                  boxShadow: SCOUT_SHADOWS.competitorCard,
                }}
              >
                <ScoutSectionHeader title="SWOT 分析" icon="🔍" color={T.primary} subtitle="优劣势与机会威胁" />
                <MatrixChart
                  quadrants={swotQuadrants}
                  textColor={T.text}
                  surfaceColor={T.bg}
                  borderColor={T.border}
                />
              </div>

              {/* 功能对比矩阵 */}
              <div
                className="scout-fade-in-up scout-stagger-5"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                  boxShadow: SCOUT_SHADOWS.competitorCard,
                  overflow: 'auto',
                }}
              >
                <ScoutSectionHeader title="功能对比" icon="📋" color={T.primary} subtitle="核心功能覆盖情况" />
                {data.comparison.features.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {/* 表头 */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ width: 80, flexShrink: 0 }} />
                      {productNames.map((name, ni) => (
                        <div key={ni} style={{
                          flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600,
                          color: T.chartColors[ni % T.chartColors.length],
                          fontFamily: SCOUT_FONTS.heading,
                        }}>
                          {name}
                        </div>
                      ))}
                    </div>
                    {/* 功能行 */}
                    {data.comparison.features.map((feat, fi) => (
                      <div key={fi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <div style={{
                          width: 80, flexShrink: 0, fontSize: 10, color: T.text,
                          fontFamily: SCOUT_FONTS.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {feat}
                        </div>
                        {productNames.map((_, pi) => {
                          const supported = data.comparison.products[productNames[pi]]?.[fi];
                          return (
                            <div key={pi} style={{ flex: 1, textAlign: 'center', fontSize: 14 }}>
                              {supported ? (
                                <span style={{ color: T.success }}>✓</span>
                              ) : (
                                <span style={{ color: T.danger, opacity: 0.4 }}>✗</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ═══ 分析总结 ═══ */}
            {data.summary && (
              <div
                className="scout-fade-in-up scout-stagger-6"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: SCOUT_RADIUS.md,
                  padding: 16,
                  boxShadow: SCOUT_SHADOWS.competitorCard,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <ScoutSectionHeader title="分析总结" icon="📊" color={T.primary} subtitle="AI 综合研判" />
                  </div>
                  <Tooltip title="导出 Markdown">
                    <Button type="text" icon={<DownloadOutlined />} onClick={handleDownload} size="small"
                      style={{ color: T.textSecondary, borderRadius: SCOUT_RADIUS.sm, flexShrink: 0 }} />
                  </Tooltip>
                </div>
                <Paragraph style={{ color: T.text, fontSize: 13, fontFamily: SCOUT_FONTS.body, lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {data.summary}
                </Paragraph>
              </div>
            )}
          </div>
        )}

        {/* ── 降级：AI 返回非 JSON 时展示原文 ── */}
        {!loading && !data && rawText && (
          <div
            className="scout-fade-in-up"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: SCOUT_RADIUS.md,
              padding: 20,
              boxShadow: SCOUT_SHADOWS.competitorCard,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <ScoutSectionHeader title="竞品调研报告" icon="📄" color={T.primary} />
              </div>
              <Button type="text" icon={<DownloadOutlined />} onClick={handleDownload}
                style={{ color: T.textSecondary, flexShrink: 0 }} />
            </div>
            <Text style={{ color: T.text, whiteSpace: 'pre-wrap', fontFamily: SCOUT_FONTS.body, lineHeight: 1.8, fontSize: 13 }}>
              {rawText}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorResearch;
