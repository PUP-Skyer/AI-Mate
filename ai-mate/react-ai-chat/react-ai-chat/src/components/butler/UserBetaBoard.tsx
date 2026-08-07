/**
 * 管家AI 面板壹 · 用户内测看板
 * ----------------------------------------------------------------
 * - 三列看板：已邀请(invited) / 测试中(testing) / 已完成反馈(completed)
 * - 点击用户卡片弹出 Drawer 查看详细反馈
 * - 顶部数据看板（总人数 / 完成率 / 平均评分 / 正面反馈占比）实时跟踪
 * - AI 反馈情感分析：调用 chatWithZhipu 输出结构化 JSON，失败降级展示原文
 */

import './butler-animations.css';
import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Button, Tag, Spin, message } from 'antd';
import { StarFilled, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { BUTLER_PALETTE, BUTLER_FONTS, BUTLER_SHADOWS, BUTLER_SURFACES } from './butler-theme';
import { ButlerSection, ButlerStatCard, ButlerEmptyState, ButlerLoadingSkeleton } from './shared';
import FeedbackGauge from './svg/FeedbackGauge';
import SentimentDonut from './svg/SentimentDonut';
import { loadBetaTesters, saveBetaTesters, type BetaTester, type BetaFeedback } from './butler-storage';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';

// ─── 常量 ────────────────────────────────────────────────────

/** 三列状态元信息：label + 状态点颜色（invited 绿 / testing 金 / completed 品红） */
const STATUS_META: Record<BetaTester['status'], { label: string; dot: string }> = {
  invited: { label: '已邀请', dot: '#52c41a' },
  testing: { label: '测试中', dot: '#faad14' },
  completed: { label: '已完成反馈', dot: '#eb2f96' },
};

/** 看板三列配置 */
const COLUMNS: { status: BetaTester['status']; title: string; no: string }[] = [
  { status: 'invited', title: '已邀请', no: '1' },
  { status: 'testing', title: '测试中', no: '2' },
  { status: 'completed', title: '已完成反馈', no: '3' },
];

/** 情感标签元信息 */
const SENTIMENT_META: Record<
  'positive' | 'neutral' | 'negative',
  { label: string; color: string; tagColor: string }
> = {
  positive: { label: '正面', color: '#52c41a', tagColor: 'success' },
  neutral: { label: '中性', color: '#faad14', tagColor: 'warning' },
  negative: { label: '负面', color: '#ff4d4f', tagColor: 'error' },
};

/** AI 情感分析结果结构 */
interface AiAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  pros: string[];
  cons: string[];
  aspects: { name: string; score: number }[];
  summary: string;
}

/** 维度评分条颜色：<40 红 / <70 金 / ≥70 绿 */
const scoreColor = (s: number) => (s >= 70 ? '#52c41a' : s >= 40 ? '#faad14' : '#ff4d4f');

/** AI 分析系统提示词：强制输出 JSON */
const AI_SYSTEM_PROMPT = `你是一位专业的用户反馈分析专家。请分析用户的内测反馈，输出严格的 JSON 格式结果。
要求：
1. 只输出 JSON，不要输出 JSON 以外的任何内容，不要使用 markdown 代码块包裹。
2. JSON 结构如下：
{
  "sentiment": "positive" | "neutral" | "negative",
  "pros": ["优点1", "优点2"],
  "cons": ["不足1", "不足2"],
  "aspects": [{ "name": "维度名称", "score": 85 }],
  "summary": "一句话总结反馈核心内容"
}
3. sentiment 三选一：positive 正面 / neutral 中性 / negative 负面。
4. pros 与 cons 为字符串数组，各提炼 2-4 条精炼要点。
5. aspects 为多维度评分数组，score 为 0-100 的整数，维度可参考界面设计、操作流畅度、功能完整性、响应速度等。
6. summary 不超过 50 字。`;

// ─── 组件 ────────────────────────────────────────────────────

const UserBetaBoard: React.FC = () => {
  // 暗色模式 & 模型可用性
  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const modelConfigs = useAIStore((s) => s.modelConfigs);
  const hasModel = useMemo(
    () => modelConfigs.some((c) => c.isEnabled && c.apiKey),
    [modelConfigs],
  );

  const surface = isDark ? BUTLER_SURFACES.dark : BUTLER_SURFACES.light;
  const theme = BUTLER_PALETTE.beta;

  // ─── 数据状态 ──────────────────────────────────────────────
  const [testers, setTesters] = useState<BetaTester[]>(() => loadBetaTesters());
  const [refreshing, setRefreshing] = useState(false);

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTester, setDrawerTester] = useState<BetaTester | null>(null);

  // AI 分析状态
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AiAnalysis | null>(null);
  const [aiRawText, setAiRawText] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  // 卡片 hover（用于 box-shadow 过渡）
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ─── 跨标签页实时跟踪 storage 变化 ─────────────────────────
  useEffect(() => {
    const handler = () => setTesters(loadBetaTesters());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ─── 聚合统计（useMemo 实时计算） ──────────────────────────
  const stats = useMemo(() => {
    const total = testers.length;
    const completed = testers.filter((t) => t.status === 'completed');
    const completedCount = completed.length;
    const completionRate = total ? Math.round((completedCount / total) * 100) : 0;

    const withFeedback = completed.filter((t) => t.feedback);
    const ratings = withFeedback.map((t) => t.feedback!.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const positiveCount = withFeedback.filter((t) => t.feedback!.sentiment === 'positive').length;
    const neutralCount = withFeedback.filter((t) => t.feedback!.sentiment === 'neutral').length;
    const negativeCount = withFeedback.filter((t) => t.feedback!.sentiment === 'negative').length;
    const positiveRate = ratings.length ? Math.round((positiveCount / ratings.length) * 100) : 0;

    // 平均满意度：聚合所有维度评分，无维度时用评分换算（rating/5 * 100）
    const allAspects = withFeedback.flatMap((t) => t.feedback!.aspects ?? []);
    const avgSatisfaction = allAspects.length
      ? Math.round(allAspects.reduce((s, a) => s + a.score, 0) / allAspects.length)
      : avgRating
        ? Math.round(avgRating * 20)
        : 0;

    return {
      total,
      completedCount,
      completionRate,
      avgRating,
      positiveRate,
      positiveCount,
      neutralCount,
      negativeCount,
      avgSatisfaction,
      hasFeedback: withFeedback.length > 0,
    };
  }, [testers]);

  // ─── 从已存反馈构建分析结果（Drawer 打开时预填） ───────────
  const buildAnalysisFromFeedback = (fb?: BetaFeedback): AiAnalysis | null => {
    if (!fb) return null;
    return {
      sentiment: fb.sentiment,
      pros: fb.pros ?? [],
      cons: fb.cons ?? [],
      aspects: fb.aspects ?? [],
      summary: '',
    };
  };

  // ─── 打开 Drawer ──────────────────────────────────────────
  const openDrawer = (tester: BetaTester) => {
    setDrawerTester(tester);
    setDrawerOpen(true);
    setAiResult(buildAnalysisFromFeedback(tester.feedback));
    setAiRawText('');
    setAiError(null);
    setAnalyzing(false);
  };

  // ─── 刷新看板 ─────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    // 模拟短暂刷新动效后重新读取 localStorage
    window.setTimeout(() => {
      setTesters(loadBetaTesters());
      setRefreshing(false);
      message.success('看板数据已刷新');
    }, 400);
  };

  // ─── 持久化 AI 分析结果到 storage（sentiment/pros/cons/aspects） ──
  const persistAnalysis = (testerId: string, analysis: AiAnalysis) => {
    setTesters((prev) => {
      const next = prev.map((t) => {
        if (t.id !== testerId) return t;
        const base: BetaFeedback = t.feedback ?? {
          rating: 0,
          content: '',
          sentiment: 'neutral',
          aspects: [],
          pros: [],
          cons: [],
          createdAt: Date.now(),
        };
        return {
          ...t,
          feedback: {
            ...base,
            sentiment: analysis.sentiment,
            pros: analysis.pros,
            cons: analysis.cons,
            aspects: analysis.aspects,
          },
        };
      });
      saveBetaTesters(next);
      return next;
    });
    // 同步 Drawer 内的快照
    setDrawerTester((prev) => {
      if (!prev || prev.id !== testerId || !prev.feedback) return prev;
      return {
        ...prev,
        feedback: {
          ...prev.feedback,
          sentiment: analysis.sentiment,
          pros: analysis.pros,
          cons: analysis.cons,
          aspects: analysis.aspects,
        },
      };
    });
  };

  // ─── AI 情感分析 ──────────────────────────────────────────
  const runAiAnalysis = async (tester: BetaTester) => {
    if (!tester.feedback?.content) {
      message.warning('该用户暂无反馈内容，无法进行 AI 分析');
      return;
    }
    setAnalyzing(true);
    setAiError(null);
    setAiRawText('');
    setAiResult(null);

    const userPrompt = `用户姓名：${tester.name}\n用户角色：${tester.role}\n评分（1-5 星）：${tester.feedback.rating}\n反馈原文：\n${tester.feedback.content}\n\n请分析以上反馈并输出 JSON。`;

    try {
      const res = await chatWithZhipu([{ role: 'user', content: userPrompt }], {
        system_prompt: AI_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      if (res.error) {
        message.error(`AI 分析失败：${res.error}`);
        setAiError(res.error);
        return;
      }

      const content = res.data?.choices?.[0]?.message?.content || '';

      // 正则提取首个 JSON 对象
      const match = content.match(/{[\s\S]*}/);
      if (!match) {
        // 降级：展示原文
        setAiRawText(content || 'AI 未返回有效内容');
        message.warning('AI 返回内容无法解析为结构化结果，已展示原文');
        return;
      }

      try {
        const parsed = JSON.parse(match[0]) as Partial<AiAnalysis>;
        const normalized: AiAnalysis = {
          sentiment:
            parsed.sentiment === 'positive' ||
            parsed.sentiment === 'neutral' ||
            parsed.sentiment === 'negative'
              ? parsed.sentiment
              : 'neutral',
          pros: Array.isArray(parsed.pros) ? parsed.pros.filter((p): p is string => !!p) : [],
          cons: Array.isArray(parsed.cons) ? parsed.cons.filter((c): c is string => !!c) : [],
          aspects: Array.isArray(parsed.aspects)
            ? parsed.aspects.filter((a) => a && a.name).map((a) => ({ name: String(a.name), score: Number(a.score) || 0 }))
            : [],
          summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        };
        setAiResult(normalized);
        persistAnalysis(tester.id, normalized);
        message.success('AI 情感分析完成');
      } catch {
        // JSON.parse 失败：降级展示原文
        setAiRawText(content);
        message.warning('AI 返回的 JSON 解析失败，已展示原文');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 调用失败';
      message.error(`AI 分析失败：${msg}`);
      setAiError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── 渲染：用户卡片 ───────────────────────────────────────
  const renderTesterCard = (tester: BetaTester) => {
    const isHovered = hoveredId === tester.id;
    const meta = STATUS_META[tester.status];
    return (
      <div
        key={tester.id}
        className="butler-card-rise"
        onClick={() => openDrawer(tester)}
        onMouseEnter={() => setHoveredId(tester.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          cursor: 'pointer',
          borderRadius: 10,
          padding: 12,
          background: surface.surface,
          border: `1px solid ${surface.border}`,
          boxShadow: isHovered ? BUTLER_SHADOWS.cardHover : BUTLER_SHADOWS.card,
          transform: isHovered ? 'translateY(-2px)' : 'none',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        }}
      >
        {/* 顶部：头像 + 姓名/角色 + 状态点 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              fontFamily: BUTLER_FONTS.heading,
              background: tester.avatarColor,
              boxShadow: `0 2px 8px ${tester.avatarColor}55`,
            }}
          >
            {tester.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: surface.text,
                fontFamily: BUTLER_FONTS.heading,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tester.name}
              </span>
              <span
                className="butler-pulse-dot"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: meta.dot,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${meta.dot}99`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: surface.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tester.role}
            </div>
          </div>
        </div>

        {/* 评分星级（仅有反馈时展示） */}
        {tester.feedback && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <StarFilled
                key={i}
                style={{
                  fontSize: 12,
                  color: i < tester.feedback!.rating ? '#faad14' : isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: surface.textSecondary, marginLeft: 2 }}>
              {tester.feedback.rating}.0
            </span>
          </div>
        )}
      </div>
    );
  };

  // ─── 渲染：Drawer 内维度评分条 ─────────────────────────────
  const renderAspectBars = (aspects: { name: string; score: number }[]) => {
    if (!aspects.length) {
      return (
        <div style={{ fontSize: 12, color: surface.textSecondary }}>暂无维度评分</div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {aspects.map((a, i) => (
          <div key={`${a.name}-${i}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: surface.textSecondary }}>{a.name}</span>
              <span style={{ fontWeight: 700, color: scoreColor(a.score) }}>{a.score}</span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(100, a.score))}%`,
                  borderRadius: 999,
                  background: scoreColor(a.score),
                  transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── 渲染：Drawer 内容 ────────────────────────────────────
  const renderDrawerContent = () => {
    if (!drawerTester) return null;
    const t = drawerTester;
    const meta = STATUS_META[t.status];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 用户信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${theme.accent}14 0%, transparent 100%)`,
            border: `1px solid ${surface.border}`,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 20,
              fontFamily: BUTLER_FONTS.heading,
              background: t.avatarColor,
              boxShadow: `0 4px 12px ${t.avatarColor}55`,
            }}
          >
            {t.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: surface.text, fontFamily: BUTLER_FONTS.heading }}>
                {t.name}
              </span>
              <Tag style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: meta.dot, marginRight: 4 }} />
                {meta.label}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: surface.textSecondary, marginTop: 2 }}>{t.role}</div>
            {t.feedback && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarFilled
                    key={i}
                    style={{ fontSize: 13, color: i < t.feedback!.rating ? '#faad14' : isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }}
                  />
                ))}
                <span style={{ fontSize: 12, color: surface.textSecondary, marginLeft: 4 }}>
                  {t.feedback.rating}.0 / 5.0
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 反馈原文 */}
        {t.feedback ? (
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: surface.text,
                marginBottom: 8,
                fontFamily: BUTLER_FONTS.heading,
              }}
            >
              反馈原文
            </div>
            <div
              style={{
                position: 'relative',
                padding: '12px 14px',
                borderRadius: 10,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(235,47,150,0.04)',
                borderLeft: `3px solid ${theme.accent}`,
                fontSize: 13,
                lineHeight: 1.7,
                color: surface.text,
              }}
            >
              {t.feedback.content}
            </div>
          </div>
        ) : (
          <ButlerEmptyState
            title="暂无反馈"
            subtitle="该用户尚未提交内测反馈内容"
            hint="待用户完成测试后可查看详细反馈"
            accent={theme.accent}
          />
        )}

        {/* AI 情感分析结果 */}
        {t.feedback && (
          <div>
            {/* 标题行 + AI 分析按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: surface.text, fontFamily: BUTLER_FONTS.heading }}>
                AI 情感分析
              </div>
              <Button
                size="small"
                type="primary"
                icon={<RobotOutlined />}
                loading={analyzing}
                disabled={!hasModel || analyzing}
                onClick={() => runAiAnalysis(t)}
                style={{
                  borderRadius: 999,
                  background: theme.gradient,
                  borderColor: theme.accent,
                }}
              >
                {aiResult ? '重新分析' : 'AI 分析'}
              </Button>
            </div>

            {/* 无模型配置提示 */}
            {!hasModel && (
              <div
                style={{
                  fontSize: 12,
                  color: '#faad14',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(250,173,20,0.08)',
                  border: '1px solid rgba(250,173,20,0.25)',
                }}
              >
                未配置可用模型，请先在「设置」中添加并启用一个大模型配置后再使用 AI 分析。
              </div>
            )}

            {/* 分析中：骨架屏 */}
            {analyzing && <ButlerLoadingSkeleton mode="gauge" accent={theme.accent} rows={3} />}

            {/* 分析失败 */}
            {!analyzing && aiError && (
              <div
                style={{
                  fontSize: 12,
                  color: '#ff4d4f',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,77,79,0.08)',
                  border: '1px solid rgba(255,77,79,0.25)',
                }}
              >
                AI 分析失败：{aiError}
              </div>
            )}

            {/* 降级：展示原文 */}
            {!analyzing && !aiError && aiRawText && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: surface.textSecondary,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {aiRawText}
              </div>
            )}

            {/* 结构化分析结果 */}
            {!analyzing && !aiError && !aiRawText && aiResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 情感标签 + 摘要 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Tag
                    color={SENTIMENT_META[aiResult.sentiment].tagColor}
                    style={{ margin: 0, borderRadius: 999, fontWeight: 600 }}
                  >
                    {SENTIMENT_META[aiResult.sentiment].label}反馈
                  </Tag>
                  {aiResult.summary && (
                    <span style={{ fontSize: 12, color: surface.textSecondary, flex: 1, minWidth: 0 }}>
                      {aiResult.summary}
                    </span>
                  )}
                </div>

                {/* 优点 / 不足 双栏 */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#52c41a', marginBottom: 6 }}>优点</div>
                    {aiResult.pros.length ? (
                      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {aiResult.pros.map((p, i) => (
                          <li key={i} style={{ fontSize: 12, color: surface.text, lineHeight: 1.6 }}>{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: 12, color: surface.textSecondary }}>—</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ff4d4f', marginBottom: 6 }}>不足</div>
                    {aiResult.cons.length ? (
                      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {aiResult.cons.map((c, i) => (
                          <li key={i} style={{ fontSize: 12, color: surface.text, lineHeight: 1.6 }}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: 12, color: surface.textSecondary }}>—</div>
                    )}
                  </div>
                </div>

                {/* 维度评分条 */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: surface.text, marginBottom: 8 }}>维度评分</div>
                  {renderAspectBars(aiResult.aspects)}
                </div>
              </div>
            )}

            {/* 空状态：提示点击分析 */}
            {!analyzing && !aiError && !aiRawText && !aiResult && hasModel && (
              <div style={{ fontSize: 12, color: surface.textSecondary, padding: '8px 0' }}>
                点击右上角「AI 分析」按钮，对反馈进行情感与维度智能解析。
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── 渲染主体 ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. 顶部头部：徽章「壹」+ 标题 + 刷新 */}
      <header
        className="butler-fade-in-up"
        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 10,
            flexShrink: 0,
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            fontFamily: BUTLER_FONTS.heading,
            background: theme.gradient,
            boxShadow: `0 4px 14px ${theme.glow}`,
          }}
        >
          壹
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: surface.text,
              fontFamily: BUTLER_FONTS.heading,
              letterSpacing: 0.3,
            }}
          >
            用户内测看板
          </h2>
          <span style={{ fontSize: 12, color: surface.textSecondary }}>
            内测用户邀请、测试进度与反馈情感分析
          </span>
        </div>
        <Button
          icon={refreshing ? <Spin size="small" /> : <ReloadOutlined />}
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ borderRadius: 999 }}
        >
          刷新
        </Button>
      </header>

      {/* 2. 统计行：4 个 ButlerStatCard 实时跟踪 */}
      <div
        className="butler-fade-in-up butler-stagger-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        <ButlerStatCard value={stats.total} suffix="人" label="内测总人数" icon="👥" accent={theme.accent} />
        <ButlerStatCard value={stats.completionRate} suffix="%" label="反馈完成率" icon="✓" accent={theme.secondary} trend={stats.completionRate >= 50 ? 'up' : 'down'} />
        <ButlerStatCard value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'} suffix="/5" label="平均评分" icon="★" accent={theme.accent} />
        <ButlerStatCard value={stats.positiveRate} suffix="%" label="正面反馈占比" icon="♥" accent={theme.secondary} trend={stats.positiveRate >= 50 ? 'up' : 'neutral'} />
      </div>

      {/* 3. 情感分析区：SentimentDonut + FeedbackGauge */}
      <ButlerSection no="01" title="情感分析总览" subtitle="聚合所有已完成反馈" accent={theme.accent}>
        {stats.hasFeedback ? (
          <div
            className="butler-fade-in-up butler-stagger-2"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
              padding: '8px 0',
            }}
          >
            <SentimentDonut
              positive={stats.positiveCount}
              neutral={stats.neutralCount}
              negative={stats.negativeCount}
              size={150}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <FeedbackGauge value={stats.avgSatisfaction} size={150} accent={theme.accent} />
            </div>
          </div>
        ) : (
          <ButlerEmptyState
            title="暂无反馈数据"
            subtitle="还没有用户提交内测反馈，完成反馈后这里将展示情感分布与满意度指数。"
            hint="等待测试用户完成反馈"
            accent={theme.accent}
          />
        )}
      </ButlerSection>

      {/* 4. 三列看板：已邀请 / 测试中 / 已完成反馈 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {COLUMNS.map((col) => {
          const list = testers.filter((t) => t.status === col.status);
          return (
            <div key={col.status} style={{ flex: 1, minWidth: 0 }}>
              <ButlerSection no={col.no} title={col.title} subtitle={`${list.length} 人`} accent={STATUS_META[col.status].dot}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {list.length ? (
                    list.map(renderTesterCard)
                  ) : (
                    <div
                      style={{
                        padding: '24px 12px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: surface.textSecondary,
                        borderRadius: 10,
                        border: `1px dashed ${surface.border}`,
                      }}
                    >
                      暂无{col.title}用户
                    </div>
                  )}
                </div>
              </ButlerSection>
            </div>
          );
        })}
      </div>

      {/* 5. 反馈详情 Drawer */}
      <Drawer
        title="反馈详情"
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 20, background: surface.bg } }}
      >
        {renderDrawerContent()}
      </Drawer>
    </div>
  );
};

export default UserBetaBoard;
