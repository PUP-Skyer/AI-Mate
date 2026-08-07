/**
 * 管家AI 面板贰 · 进度跟踪
 * ----------------------------------------------------------------
 * - ProgressTimeline 垂直时间轴：里程碑节点 + 内嵌进度环（SVG 动画）
 * - 点击里程碑展开任务清单，勾选 Checkbox 自动推进进度并持久化
 * - AI 进度总结：调用 chatWithZhipu 生成 Markdown 报告 + 风险预警卡片
 */

import './butler-animations.css';
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Tag, Checkbox, Spin, message, Empty } from 'antd';
import { RobotOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { BUTLER_PALETTE, BUTLER_FONTS, BUTLER_SHADOWS, BUTLER_SURFACES } from './butler-theme';
import { ButlerSection, ButlerStatCard, ButlerLoadingSkeleton } from './shared';
import ProgressTimeline from './svg/ProgressTimeline';
import { loadMilestones, saveMilestones, loadProgressSummary, saveProgressSummary, type Milestone, type ProgressSummary } from './butler-storage';
import { splitByH2, renderMarkdown } from './butler-markdown';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';

// ─── 常量 ────────────────────────────────────────────────────

/** 里程碑状态元信息：标签 + 颜色 + Tag色 + 图标 */
const STATUS_META: Record<
  Milestone['status'],
  { label: string; color: string; tagColor: string; icon: React.ReactNode }
> = {
  completed: { label: '已完成', color: '#52c41a', tagColor: 'success', icon: <CheckCircleOutlined /> },
  in_progress: { label: '进行中', color: '#faad14', tagColor: 'warning', icon: <ClockCircleOutlined /> },
  pending: { label: '待开始', color: '#bfbfbf', tagColor: 'default', icon: <ClockCircleOutlined /> },
  at_risk: { label: '有风险', color: '#ff4d4f', tagColor: 'error', icon: <ExclamationCircleOutlined /> },
};

// ─── 组件 ────────────────────────────────────────────────────

const ProgressTracking: React.FC = () => {
  // 暗色模式
  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const surface = isDark ? BUTLER_SURFACES.dark : BUTLER_SURFACES.light;
  const theme = BUTLER_PALETTE.progress;

  // ─── 数据状态 ──────────────────────────────────────────────
  const [milestones, setMilestones] = useState<Milestone[]>(() => loadMilestones());
  const [summary, setSummary] = useState<ProgressSummary | null>(() => loadProgressSummary());
  const [generating, setGenerating] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ─── 跨标签页同步 storage 变化 ─────────────────────────────
  useEffect(() => {
    const handler = () => {
      setMilestones(loadMilestones());
      setSummary(loadProgressSummary());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ─── 聚合统计（useMemo 实时计算） ──────────────────────────
  const stats = useMemo(() => {
    const total = milestones.length;
    const overallProgress = total
      ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / total)
      : 0;
    const completed = milestones.filter((m) => m.status === 'completed').length;
    const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
    const atRisk = milestones.filter((m) => m.status === 'at_risk').length;
    return { total, overallProgress, completed, inProgress, atRisk };
  }, [milestones]);

  // ─── 任务勾选推进逻辑 ──────────────────────────────────────
  const toggleTask = (milestoneId: string, taskId: string) => {
    const newMilestones = milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const tasks = m.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
      const doneCount = tasks.filter((t) => t.done).length;
      const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
      const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
      return { ...m, tasks, progress, status };
    });
    setMilestones(newMilestones);
    saveMilestones(newMilestones);
  };

  // ─── 展开 / 收起里程碑任务清单 ─────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── AI 进度总结 ──────────────────────────────────────────
  const generateSummary = async () => {
    setGenerating(true);
    try {
      const res = await chatWithZhipu(
        [
          {
            role: 'user',
            content: `项目里程碑数据：${JSON.stringify(
              milestones.map((m) => ({
                title: m.title,
                progress: m.progress,
                status: m.status,
                targetDate: m.targetDate,
                tasks: m.tasks.map((t) => ({ text: t.text, done: t.done })),
              })),
            )}`,
          },
        ],
        {
          system_prompt:
            '你是一位项目管理顾问。根据项目里程碑数据，生成进度总结报告（Markdown）。结构：## 整体进展\n## 关键成果\n## 风险预警（⚠️前缀标注风险项）\n## 下一步建议',
        },
      );

      if (res.error) {
        message.error(`AI 总结生成失败：${res.error}`);
        return;
      }

      const content = res.data?.choices?.[0]?.message?.content || '';
      if (!content) {
        message.warning('AI 未返回有效内容');
        return;
      }

      // 正则提取风险预警项
      const riskAlerts = content.match(/⚠️[^\n]+/g) || [];
      const newSummary: ProgressSummary = {
        content,
        generatedAt: Date.now(),
        riskAlerts,
      };
      setSummary(newSummary);
      saveProgressSummary(newSummary);
      message.success('AI 进度总结已生成');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 调用失败';
      message.error(`AI 总结生成失败：${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  // ─── 渲染：里程碑任务清单（可展开） ─────────────────────────
  const renderMilestoneItem = (m: Milestone) => {
    const isExpanded = expandedIds.has(m.id);
    const meta = STATUS_META[m.status];
    const doneCount = m.tasks.filter((t) => t.done).length;

    return (
      <div
        key={m.id}
        className="butler-card-rise"
        style={{
          borderRadius: 10,
          background: surface.surface,
          border: `1px solid ${surface.border}`,
          boxShadow: BUTLER_SHADOWS.card,
          overflow: 'hidden',
        }}
      >
        {/* 可点击头部 */}
        <div
          onClick={() => toggleExpand(m.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          {/* 状态色点 */}
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: meta.color,
              flexShrink: 0,
              boxShadow: `0 0 6px ${meta.color}66`,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: surface.text,
                  fontFamily: BUTLER_FONTS.heading,
                }}
              >
                {m.title}
              </span>
              <Tag
                color={meta.tagColor}
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {meta.icon}
                {meta.label}
              </Tag>
            </div>
            <div
              style={{
                fontSize: 11,
                color: surface.textSecondary,
                marginTop: 2,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>目标 {m.targetDate}</span>
              <span>进度 {m.progress}%</span>
              <span>
                任务 {doneCount}/{m.tasks.length}
              </span>
            </div>
          </div>
          {/* 展开指示箭头 */}
          <span
            style={{
              fontSize: 12,
              color: surface.textSecondary,
              transition: 'transform 0.25s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              flexShrink: 0,
            }}
          >
            ▶
          </span>
        </div>

        {/* 展开内容：有序任务清单 + Checkbox */}
        {isExpanded && (
          <div
            style={{
              padding: '4px 14px 14px 34px',
              borderTop: `1px solid ${surface.border}`,
            }}
          >
            {m.description && (
              <div
                style={{
                  fontSize: 12,
                  color: surface.textSecondary,
                  marginBottom: 8,
                  fontStyle: 'italic',
                  fontFamily: BUTLER_FONTS.body,
                }}
              >
                {m.description}
              </div>
            )}
            <ol
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {m.tasks.map((t, idx) => (
                <li
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: t.done
                      ? isDark
                        ? 'rgba(82,196,26,0.06)'
                        : 'rgba(82,196,26,0.04)'
                      : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: surface.textSecondary,
                      fontWeight: 600,
                      minWidth: 18,
                      fontFamily: BUTLER_FONTS.mono,
                    }}
                  >
                    {idx + 1}.
                  </span>
                  <Checkbox
                    checked={t.done}
                    onChange={() => toggleTask(m.id, t.id)}
                    style={{ flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: t.done ? surface.textSecondary : surface.text,
                      textDecoration: t.done ? 'line-through' : 'none',
                      fontFamily: BUTLER_FONTS.body,
                      transition: 'color 0.2s ease, text-decoration 0.2s ease',
                    }}
                  >
                    {t.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  // ─── 渲染：AI 总结报告区 ───────────────────────────────────
  const renderSummary = () => {
    if (generating) {
      return <ButlerLoadingSkeleton mode="grid" accent={theme.accent} rows={4} />;
    }

    if (!summary) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ fontSize: 12, color: surface.textSecondary }}>
              暂无 AI 总结，点击顶部「生成AI总结」按钮
            </span>
          }
        />
      );
    }

    const sections = splitByH2(summary.content);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 风险预警卡片：红色边框 + butler-risk-pulse 脉动动画 */}
        {summary.riskAlerts.length > 0 && (
          <div
            className="butler-risk-pulse"
            style={{
              border: '1px solid #ff4d4f',
              borderRadius: 10,
              padding: 14,
              background: isDark ? 'rgba(255,77,79,0.06)' : 'rgba(255,77,79,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
                fontSize: 13,
                fontWeight: 700,
                color: '#ff4d4f',
                fontFamily: BUTLER_FONTS.heading,
              }}
            >
              <ExclamationCircleOutlined />
              风险预警（{summary.riskAlerts.length}）
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {summary.riskAlerts.map((alert, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: surface.text,
                    lineHeight: 1.6,
                    padding: '4px 0',
                    fontFamily: BUTLER_FONTS.body,
                  }}
                >
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Markdown 分段渲染 */}
        {sections.map((section, i) => (
          <div key={i}>
            <h4
              style={{
                margin: '0 0 8px',
                fontSize: 14,
                fontWeight: 700,
                color: theme.accent,
                fontFamily: BUTLER_FONTS.heading,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  background: theme.accent,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {section.title}
            </h4>
            <div
              className="butler-progress-md"
              style={{
                fontSize: 13,
                lineHeight: 1.8,
                color: surface.text,
                fontFamily: BUTLER_FONTS.body,
                paddingLeft: 10,
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
            />
          </div>
        ))}

        {/* 生成时间戳 */}
        <div
          style={{
            fontSize: 11,
            color: surface.textSecondary,
            textAlign: 'right',
            fontFamily: BUTLER_FONTS.mono,
          }}
        >
          生成于 {new Date(summary.generatedAt).toLocaleString('zh-CN')}
        </div>
      </div>
    );
  };

  // ─── 渲染主体 ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Markdown 渲染作用域样式 */}
      <style>{`
        .butler-progress-md ul { margin: 4px 0; padding-left: 20px; list-style: disc; }
        .butler-progress-md ol { margin: 4px 0; padding-left: 20px; list-style: decimal; }
        .butler-progress-md li { margin: 3px 0; line-height: 1.7; }
        .butler-progress-md strong { font-weight: 700; }
        .butler-progress-md em { font-style: italic; }
        .butler-progress-md code {
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 12px;
          font-family: ${BUTLER_FONTS.mono};
        }
        .butler-progress-md table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
          font-size: 12px;
        }
        .butler-progress-md td {
          border: 1px solid ${surface.border};
          padding: 4px 8px;
        }
        .butler-progress-md br + br { display: block; margin-top: 6px; }
      `}</style>

      {/* 1. 顶部头部：徽章「贰」+ 标题 + 生成AI总结按钮 */}
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
          贰
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
            进度跟踪
          </h2>
          <span style={{ fontSize: 12, color: surface.textSecondary }}>
            里程碑进度、任务推进与 AI 智能总结
          </span>
        </div>
        <Button
          type="primary"
          icon={generating ? <Spin size="small" /> : <RobotOutlined />}
          loading={generating}
          onClick={generateSummary}
          style={{
            borderRadius: 999,
            background: theme.gradient,
            borderColor: theme.accent,
          }}
        >
          {generating ? '生成中...' : '生成AI总结'}
        </Button>
      </header>

      {/* 2. 统计行：4 个 ButlerStatCard */}
      <div
        className="butler-fade-in-up butler-stagger-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        <ButlerStatCard value={stats.overallProgress} suffix="%" label="整体进度" icon="📊" accent={theme.accent} />
        <ButlerStatCard value={stats.completed} suffix="个" label="已完成里程碑" icon="✓" accent="#52c41a" />
        <ButlerStatCard value={stats.inProgress} suffix="个" label="进行中" icon="⏳" accent={theme.secondary} />
        <ButlerStatCard value={stats.atRisk} suffix="个" label="风险数" icon="⚠" accent="#ff4d4f" />
      </div>

      {/* 3. 里程碑进度时间轴：ProgressTimeline + 可展开任务清单 */}
      <ButlerSection no="01" title="里程碑进度" subtitle="垂直时间轴 · 点击展开任务清单" accent={theme.accent}>
        {milestones.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ProgressTimeline 视觉总览（垂直竖线 + 进度环节点） */}
            <div
              className="butler-fade-in-up butler-stagger-2"
              style={{
                padding: 16,
                borderRadius: 10,
                background: surface.surface,
                border: `1px solid ${surface.border}`,
                boxShadow: BUTLER_SHADOWS.card,
              }}
            >
              <ProgressTimeline milestones={milestones} accent={theme.accent} />
            </div>

            {/* 可交互任务清单：点击展开 + Checkbox 勾选推进 */}
            <div
              className="butler-fade-in-up butler-stagger-3"
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {milestones.map(renderMilestoneItem)}
            </div>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无里程碑数据" />
        )}
      </ButlerSection>

      {/* 4. AI 进度总结报告区：Markdown 渲染 + 风险预警卡片 */}
      <ButlerSection no="02" title="AI 进度总结" subtitle="智能分析整体进展与风险预警" accent={theme.secondary}>
        {renderSummary()}
      </ButlerSection>
    </div>
  );
};

export default ProgressTracking;
