/**
 * 管家AI 面板肆 · 团队协作
 * ----------------------------------------------------------------
 * - 团队成员卡片：头像(首字+avatarColor) + 状态点(butler-pulse-dot) + WorkloadBar + 任务数
 * - 点击成员卡片打开 Drawer：任务序列 Markdown 渲染 + 可勾选任务清单 + 技能标签 + 导出
 * - 每周会议卡片：周次标签(第N周) + 标题 + 时间 + 类型标签 + 状态
 * - 点击会议卡片打开 Drawer：会议链接(可点击/复制) + AI 会议总结(Markdown)
 */

import './butler-animations.css';
import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Button, Tag, Checkbox, Spin, message, Tooltip } from 'antd';
import { LinkOutlined, CopyOutlined, RobotOutlined, VideoCameraOutlined, ExportOutlined } from '@ant-design/icons';
import { BUTLER_PALETTE, BUTLER_FONTS, BUTLER_SHADOWS, BUTLER_SURFACES } from './butler-theme';
import { ButlerSection, ButlerStatCard, ButlerLoadingSkeleton } from './shared';
import WorkloadBar from './svg/WorkloadBar';
import { loadTeamMembers, saveTeamMembers, loadTeamMeetings, saveTeamMeetings, type TeamMember, type TeamMeeting, type TeamTask } from './butler-storage';
import { renderMarkdown } from './butler-markdown';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';

// ─── 常量 ────────────────────────────────────────────────────

/** 成员状态元信息：在线绿 / 忙碌金 / 离线灰 */
const STATUS_META: Record<TeamMember['status'], { label: string; color: string }> = {
  online: { label: '在线', color: '#52c41a' },
  busy: { label: '忙碌', color: '#faad14' },
  offline: { label: '离线', color: '#bfbfbf' },
};

/** 会议类型元信息：常规蓝 / 重要红 / 复盘紫 */
const MEETING_TYPE_META: Record<TeamMeeting['type'], { label: string; color: string; tagColor: string }> = {
  routine: { label: '常规', color: '#1890ff', tagColor: 'blue' },
  important: { label: '重要', color: '#ff4d4f', tagColor: 'red' },
  review: { label: '复盘', color: '#722ed1', tagColor: 'purple' },
};

/** 会议状态元信息 */
const MEETING_STATUS_META: Record<TeamMeeting['status'], { label: string; color: string; tagColor: string }> = {
  scheduled: { label: '待开始', color: '#1890ff', tagColor: 'processing' },
  completed: { label: '已完成', color: '#52c41a', tagColor: 'success' },
  cancelled: { label: '已取消', color: '#bfbfbf', tagColor: 'default' },
};

/** 任务状态元信息 */
const TASK_STATUS_META: Record<TeamTask['status'], { label: string; color: string }> = {
  todo: { label: '待办', color: '#bfbfbf' },
  doing: { label: '进行中', color: '#faad14' },
  done: { label: '已完成', color: '#52c41a' },
};

// ─── 组件 ────────────────────────────────────────────────────

const TeamCollaboration: React.FC = () => {
  // 暗色模式
  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const surface = isDark ? BUTLER_SURFACES.dark : BUTLER_SURFACES.light;
  const theme = BUTLER_PALETTE.team;

  // ─── 数据状态 ──────────────────────────────────────────────
  const [members, setMembers] = useState<TeamMember[]>(() => loadTeamMembers());
  const [meetings, setMeetings] = useState<TeamMeeting[]>(() => loadTeamMeetings());
  const [generating, setGenerating] = useState(false);

  // Drawer 选中 id（从数组派生最新数据，保证勾选/生成总结后即时刷新）
  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);
  const [drawerMeetingId, setDrawerMeetingId] = useState<string | null>(null);

  // ─── 跨标签页同步 storage 变化 ─────────────────────────────
  useEffect(() => {
    const handler = () => {
      setMembers(loadTeamMembers());
      setMeetings(loadTeamMeetings());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ─── 派生：Drawer 当前对象 ─────────────────────────────────
  const drawerMember = useMemo(
    () => members.find((m) => m.id === drawerMemberId) || null,
    [members, drawerMemberId],
  );
  const drawerMeeting = useMemo(
    () => meetings.find((m) => m.id === drawerMeetingId) || null,
    [meetings, drawerMeetingId],
  );

  // ─── 聚合统计（useMemo 实时计算） ──────────────────────────
  const stats = useMemo(() => {
    const total = members.length;
    const online = members.filter((m) => m.status === 'online').length;
    const maxWeek = meetings.length > 0 ? Math.max(...meetings.map((m) => m.weekIndex)) : 0;
    const thisWeekMeetings = meetings.filter((m) => m.weekIndex === maxWeek).length;
    const avgWorkload = total > 0 ? Math.round(members.reduce((sum, m) => sum + m.workload, 0) / total) : 0;
    return { total, online, thisWeekMeetings, avgWorkload };
  }, [members, meetings]);

  // ─── 任务勾选：切换 done/todo 并重算 workload ──────────────
  const toggleTeamTask = (memberId: string, taskId: string) => {
    const newMembers = members.map((m) => {
      if (m.id !== memberId) return m;
      const tasks = m.tasks.map((t) =>
        t.id === taskId ? { ...t, status: t.status === 'done' ? ('todo' as const) : ('done' as const) } : t,
      );
      const doneCount = tasks.filter((t) => t.status === 'done').length;
      const workload = tasks.length > 0 ? Math.round((1 - doneCount / tasks.length) * 100) : 0;
      return { ...m, tasks, workload };
    });
    setMembers(newMembers);
    saveTeamMembers(newMembers);
  };

  // ─── 复制会议链接 ──────────────────────────────────────────
  const copyLink = (link: string) => {
    if (!link) {
      message.warning('暂无会议链接');
      return;
    }
    navigator.clipboard
      .writeText(link)
      .then(() => message.success('会议链接已复制到剪贴板'))
      .catch(() => message.error('复制失败，请手动复制'));
  };

  // ─── 导出成员信息（复制文本，降级 window.print） ───────────
  const exportMember = (member: TeamMember) => {
    const lines = [
      `成员：${member.name}（${member.role}）`,
      `状态：${STATUS_META[member.status].label}`,
      `工作量：${member.workload}%`,
      `技能：${member.skills.join('、')}`,
      '',
      '── 任务序列 ──',
      member.taskSequence,
      '',
      '── 任务清单 ──',
      ...member.tasks
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((t) => `${t.order}. [${t.status === 'done' ? 'x' : ' '}] ${t.text}`),
    ];
    const text = lines.join('\n');
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('成员信息已复制到剪贴板'))
      .catch(() => {
        // 降级到打印
        window.print();
      });
  };

  // ─── AI 会议总结 ──────────────────────────────────────────
  const generateMeetingSummary = async (meeting: TeamMeeting) => {
    setGenerating(true);
    try {
      const res = await chatWithZhipu(
        [
          {
            role: 'user',
            content: `会议信息：${JSON.stringify({
              title: meeting.title,
              date: meeting.date,
              time: meeting.time,
              attendees: meeting.attendees,
              type: meeting.type,
            })}`,
          },
        ],
        {
          system_prompt:
            '你是一位团队会议记录专家。根据会议信息，生成结构化会议总结（Markdown）。结构：## 会议信息\n## 讨论要点\n## 决议事项\n## 行动项（表格格式）\n## 下次会议建议',
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

      // 更新 meeting.summary 并持久化
      const newMeetings = meetings.map((m) =>
        m.id === meeting.id ? { ...m, summary: content } : m,
      );
      setMeetings(newMeetings);
      saveTeamMeetings(newMeetings);
      message.success('AI 会议总结已生成');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 调用失败';
      message.error(`AI 总结生成失败：${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  // ─── 渲染：成员卡片 ────────────────────────────────────────
  const renderMemberCard = (member: TeamMember, index: number) => {
    const meta = STATUS_META[member.status];
    const taskTotal = member.tasks.length;
    const taskDone = member.tasks.filter((t) => t.status === 'done').length;
    const staggerClass = `butler-stagger-${Math.min(index + 1, 9)}`;

    return (
      <div
        key={member.id}
        className={`butler-card-rise ${staggerClass}`}
        onClick={() => setDrawerMemberId(member.id)}
        style={{
          position: 'relative',
          borderRadius: 12,
          background: surface.surface,
          border: `1px solid ${surface.border}`,
          boxShadow: BUTLER_SHADOWS.card,
          padding: 16,
          cursor: 'pointer',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = BUTLER_SHADOWS.cardHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = BUTLER_SHADOWS.card;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* 头部：头像 + 姓名/角色 + 状态点 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              fontFamily: BUTLER_FONTS.heading,
              background: member.avatarColor,
              boxShadow: `0 3px 10px ${member.avatarColor}55`,
            }}
          >
            {member.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: surface.text,
                  fontFamily: BUTLER_FONTS.heading,
                }}
              >
                {member.name}
              </span>
              {/* 状态点 — butler-pulse-dot 脉动（离线不脉动） */}
              <span
                className={member.status === 'offline' ? '' : 'butler-pulse-dot'}
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: meta.color,
                  boxShadow: `0 0 6px ${meta.color}66`,
                  flexShrink: 0,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: surface.textSecondary,
                marginTop: 2,
                fontFamily: BUTLER_FONTS.body,
              }}
            >
              {member.role}
            </div>
          </div>
          {/* 任务数 */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: theme.accent,
                fontFamily: BUTLER_FONTS.heading,
                lineHeight: 1,
              }}
            >
              {taskDone}/{taskTotal}
            </div>
            <div
              style={{
                fontSize: 10,
                color: surface.textSecondary,
                marginTop: 2,
              }}
            >
              任务
            </div>
          </div>
        </div>

        {/* WorkloadBar 工作量条 */}
        <WorkloadBar value={member.workload} accent={theme.accent} width={200} />
      </div>
    );
  };

  // ─── 渲染：会议卡片 ────────────────────────────────────────
  const renderMeetingCard = (meeting: TeamMeeting, index: number) => {
    const typeMeta = MEETING_TYPE_META[meeting.type];
    const statusMeta = MEETING_STATUS_META[meeting.status];
    const staggerClass = `butler-stagger-${Math.min(index + 1, 9)}`;

    return (
      <div
        key={meeting.id}
        className={`butler-card-rise ${staggerClass}`}
        onClick={() => setDrawerMeetingId(meeting.id)}
        style={{
          position: 'relative',
          borderRadius: 12,
          background: surface.surface,
          border: `1px solid ${surface.border}`,
          boxShadow: BUTLER_SHADOWS.card,
          padding: '14px 16px',
          cursor: 'pointer',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = BUTLER_SHADOWS.cardHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = BUTLER_SHADOWS.card;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* 左侧：周次标签 第N周 */}
        <div
          style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.accent}22 0%, ${theme.secondary}22 100%)`,
            border: `1px solid ${theme.accent}33`,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: surface.textSecondary,
              fontFamily: BUTLER_FONTS.body,
              lineHeight: 1,
            }}
          >
            第
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: theme.accent,
              fontFamily: BUTLER_FONTS.heading,
              lineHeight: 1.1,
            }}
          >
            {meeting.weekIndex}
          </span>
          <span
            style={{
              fontSize: 10,
              color: surface.textSecondary,
              fontFamily: BUTLER_FONTS.body,
              lineHeight: 1,
            }}
          >
            周
          </span>
        </div>

        {/* 中间：标题 + 时间 + 参会人 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: surface.text,
                fontFamily: BUTLER_FONTS.heading,
              }}
            >
              {meeting.title}
            </span>
            <Tag color={typeMeta.tagColor} style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>
              {typeMeta.label}
            </Tag>
          </div>
          <div
            style={{
              fontSize: 12,
              color: surface.textSecondary,
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              fontFamily: BUTLER_FONTS.body,
            }}
          >
            <span>
              {meeting.date} {meeting.time}
            </span>
            <span>{meeting.attendees.length} 人参会</span>
          </div>
        </div>

        {/* 右侧：状态标签 + 图标 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Tag color={statusMeta.tagColor} style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>
            {statusMeta.label}
          </Tag>
          <VideoCameraOutlined style={{ fontSize: 16, color: theme.secondary, opacity: 0.6 }} />
        </div>
      </div>
    );
  };

  // ─── 渲染：成员详情 Drawer 内容 ────────────────────────────
  const renderMemberDrawer = () => {
    if (!drawerMember) return null;
    const m = drawerMember;
    const meta = STATUS_META[m.status];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 头部：大头像 + 姓名 + 角色 + 状态 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${m.avatarColor}14 0%, transparent 100%)`,
            border: `1px solid ${surface.border}`,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 24,
              fontFamily: BUTLER_FONTS.heading,
              background: m.avatarColor,
              boxShadow: `0 4px 14px ${m.avatarColor}55`,
            }}
          >
            {m.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: surface.text,
                  fontFamily: BUTLER_FONTS.heading,
                }}
              >
                {m.name}
              </span>
              <Tag
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  className={m.status === 'offline' ? '' : 'butler-pulse-dot'}
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: meta.color,
                  }}
                />
                {meta.label}
              </Tag>
            </div>
            <div style={{ fontSize: 13, color: surface.textSecondary, marginTop: 4 }}>{m.role}</div>
          </div>
        </div>

        {/* WorkloadBar 工作量条 */}
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: surface.surface,
            border: `1px solid ${surface.border}`,
          }}
        >
          <WorkloadBar value={m.workload} accent={theme.accent} width={280} />
        </div>

        {/* 任务序列 Markdown 渲染 */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
              fontSize: 13,
              fontWeight: 700,
              color: theme.accent,
              fontFamily: BUTLER_FONTS.heading,
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
            任务序列
          </div>
          <div
            className="butler-team-md"
            style={{
              fontSize: 13,
              lineHeight: 1.8,
              color: surface.text,
              fontFamily: BUTLER_FONTS.body,
              padding: '12px 14px',
              borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${surface.border}`,
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(m.taskSequence) }}
          />
        </div>

        {/* 可勾选任务清单（勾选更新状态并重算 workload） */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
              fontSize: 13,
              fontWeight: 700,
              color: theme.accent,
              fontFamily: BUTLER_FONTS.heading,
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
            任务清单（勾选更新工作量）
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {m.tasks
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((t) => {
                const taskMeta = TASK_STATUS_META[t.status];
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background:
                        t.status === 'done'
                          ? isDark
                            ? 'rgba(82,196,26,0.06)'
                            : 'rgba(82,196,26,0.04)'
                          : 'transparent',
                      border: `1px solid ${surface.border}`,
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <Checkbox
                      checked={t.status === 'done'}
                      onChange={() => toggleTeamTask(m.id, t.id)}
                      style={{ flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: surface.textSecondary,
                        minWidth: 20,
                        fontFamily: BUTLER_FONTS.mono,
                      }}
                    >
                      {t.order}.
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: t.status === 'done' ? surface.textSecondary : surface.text,
                        textDecoration: t.status === 'done' ? 'line-through' : 'none',
                        fontFamily: BUTLER_FONTS.body,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {t.text}
                    </span>
                    {t.status === 'doing' && (
                      <Tag color="warning" style={{ margin: 0, borderRadius: 999, fontSize: 10 }}>
                        {taskMeta.label}
                      </Tag>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* 技能标签 */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
              fontSize: 13,
              fontWeight: 700,
              color: theme.accent,
              fontFamily: BUTLER_FONTS.heading,
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
            技能标签
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {m.skills.map((skill, i) => (
              <Tag
                key={i}
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontSize: 12,
                  padding: '2px 10px',
                  color: theme.secondary,
                  borderColor: `${theme.secondary}44`,
                  background: isDark ? 'rgba(114,46,209,0.08)' : 'rgba(114,46,209,0.04)',
                }}
              >
                {skill}
              </Tag>
            ))}
          </div>
        </div>

        {/* 导出按钮（复制文本，降级 window.print） */}
        <Tooltip title="复制成员任务信息到剪贴板">
          <Button
            block
            icon={<ExportOutlined />}
            onClick={() => exportMember(m)}
            style={{
              borderRadius: 999,
              borderColor: theme.accent,
              color: theme.accent,
            }}
          >
            导出成员信息
          </Button>
        </Tooltip>
      </div>
    );
  };

  // ─── 渲染：会议详情 Drawer 内容 ────────────────────────────
  const renderMeetingDrawer = () => {
    if (!drawerMeeting) return null;
    const m = drawerMeeting;
    const typeMeta = MEETING_TYPE_META[m.type];
    const statusMeta = MEETING_STATUS_META[m.status];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 会议信息卡片 */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${theme.accent}14 0%, ${theme.secondary}14 100%)`,
            border: `1px solid ${surface.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <Tag color={typeMeta.tagColor} style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>
              {typeMeta.label}
            </Tag>
            <Tag color={statusMeta.tagColor} style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>
              {statusMeta.label}
            </Tag>
            <Tag
              style={{
                margin: 0,
                borderRadius: 999,
                fontSize: 11,
                color: theme.accent,
                borderColor: `${theme.accent}44`,
              }}
            >
              第 {m.weekIndex} 周
            </Tag>
          </div>
          <h3
            style={{
              margin: '0 0 10px',
              fontSize: 18,
              fontWeight: 700,
              color: surface.text,
              fontFamily: BUTLER_FONTS.heading,
            }}
          >
            {m.title}
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 13,
              color: surface.textSecondary,
              fontFamily: BUTLER_FONTS.body,
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: surface.text }}>日期：</span>
              {m.date}
            </div>
            <div>
              <span style={{ fontWeight: 600, color: surface.text }}>时间：</span>
              {m.time}
            </div>
            <div>
              <span style={{ fontWeight: 600, color: surface.text }}>参会人：</span>
              {m.attendees.join('、')}
            </div>
          </div>
        </div>

        {/* 会议链接区（可点击 window.open + 复制按钮） */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
              fontSize: 13,
              fontWeight: 700,
              color: theme.accent,
              fontFamily: BUTLER_FONTS.heading,
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
            会议链接
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${surface.border}`,
            }}
          >
            <LinkOutlined style={{ color: theme.accent, flexShrink: 0 }} />
            <span
              onClick={() => m.meetingLink && window.open(m.meetingLink, '_blank')}
              style={{
                flex: 1,
                fontSize: 12,
                color: theme.accent,
                fontFamily: BUTLER_FONTS.mono,
                cursor: m.meetingLink ? 'pointer' : 'default',
                wordBreak: 'break-all',
                textDecoration: m.meetingLink ? 'underline' : 'none',
                opacity: m.meetingLink ? 1 : 0.5,
              }}
            >
              {m.meetingLink || '暂无链接'}
            </span>
            <Tooltip title="复制链接">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyLink(m.meetingLink)}
                style={{ borderRadius: 8, flexShrink: 0 }}
              />
            </Tooltip>
            <Tooltip title="加入会议">
              <Button
                size="small"
                type="primary"
                icon={<VideoCameraOutlined />}
                onClick={() => m.meetingLink && window.open(m.meetingLink, '_blank')}
                style={{
                  borderRadius: 8,
                  flexShrink: 0,
                  background: theme.gradient,
                  borderColor: theme.accent,
                }}
              />
            </Tooltip>
          </div>
        </div>

        {/* AI 总结区（Markdown 渲染 / 生成总结按钮） */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                color: theme.accent,
                fontFamily: BUTLER_FONTS.heading,
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
              AI 会议总结
            </div>
            <Button
              size="small"
              type="primary"
              icon={generating ? <Spin size="small" /> : <RobotOutlined />}
              loading={generating}
              onClick={() => generateMeetingSummary(m)}
              style={{
                borderRadius: 999,
                background: theme.gradient,
                borderColor: theme.accent,
              }}
            >
              {generating ? '生成中...' : m.summary ? '重新生成' : '生成总结'}
            </Button>
          </div>

          {generating ? (
            <ButlerLoadingSkeleton mode="grid" accent={theme.accent} rows={4} />
          ) : m.summary ? (
            <div
              className="butler-team-md"
              style={{
                fontSize: 13,
                lineHeight: 1.8,
                color: surface.text,
                fontFamily: BUTLER_FONTS.body,
                padding: '12px 14px',
                borderRadius: 10,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${surface.border}`,
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.summary) }}
            />
          ) : (
            <div
              style={{
                padding: '20px 16px',
                textAlign: 'center',
                fontSize: 12,
                color: surface.textSecondary,
                fontFamily: BUTLER_FONTS.body,
                borderRadius: 10,
                background: surface.surface,
                border: `1px dashed ${surface.border}`,
              }}
            >
              暂无 AI 总结，点击「生成总结」按钮智能生成
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── 渲染主体 ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Markdown 渲染作用域样式 */}
      <style>{`
        .butler-team-md h1 { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: ${surface.text}; }
        .butler-team-md h2 { font-size: 15px; font-weight: 700; margin: 12px 0 6px; color: ${theme.accent}; }
        .butler-team-md h3 { font-size: 14px; font-weight: 700; margin: 10px 0 4px; color: ${surface.text}; }
        .butler-team-md ul { margin: 4px 0; padding-left: 20px; list-style: disc; }
        .butler-team-md ol { margin: 4px 0; padding-left: 20px; list-style: decimal; }
        .butler-team-md li { margin: 3px 0; line-height: 1.7; }
        .butler-team-md strong { font-weight: 700; }
        .butler-team-md em { font-style: italic; }
        .butler-team-md code {
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 12px;
          font-family: ${BUTLER_FONTS.mono};
        }
        .butler-team-md table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
          font-size: 12px;
        }
        .butler-team-md td {
          border: 1px solid ${surface.border};
          padding: 4px 8px;
        }
        .butler-team-md br + br { display: block; margin-top: 6px; }
      `}</style>

      {/* 1. 顶部头部：徽章「肆」+ 标题 */}
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
          肆
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
            团队协作
          </h2>
          <span style={{ fontSize: 12, color: surface.textSecondary }}>
            成员任务跟进与每周会议管理 · 点击卡片查看详情
          </span>
        </div>
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
        <ButlerStatCard value={stats.total} suffix="人" label="团队成员" icon="👥" accent={theme.accent} />
        <ButlerStatCard value={stats.online} suffix="人" label="在线人数" icon="🟢" accent="#52c41a" />
        <ButlerStatCard value={stats.thisWeekMeetings} suffix="场" label="本周会议" icon="📅" accent={theme.secondary} />
        <ButlerStatCard value={stats.avgWorkload} suffix="%" label="平均工作量" icon="📊" accent="#faad14" />
      </div>

      {/* 3. 团队成员区：ButlerSection + 成员卡片网格 */}
      <ButlerSection no="01" title="团队成员" subtitle={`${members.length} 位成员 · 点击查看任务详情`} accent={theme.accent}>
        {members.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {members.map((m, i) => renderMemberCard(m, i))}
          </div>
        ) : (
          <ButlerLoadingSkeleton mode="cards" accent={theme.accent} rows={3} />
        )}
      </ButlerSection>

      {/* 4. 每周会议区：ButlerSection + 会议卡片列表 */}
      <ButlerSection no="02" title="每周会议" subtitle={`${meetings.length} 场会议 · 点击查看链接与总结`} accent={theme.secondary}>
        {meetings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meetings.map((m, i) => renderMeetingCard(m, i))}
          </div>
        ) : (
          <ButlerLoadingSkeleton mode="timeline" accent={theme.secondary} rows={3} />
        )}
      </ButlerSection>

      {/* 5. 成员详情 Drawer */}
      <Drawer
        title="成员详情"
        placement="right"
        width={520}
        open={!!drawerMember}
        onClose={() => setDrawerMemberId(null)}
        styles={{ body: { padding: 20, background: surface.bg } }}
      >
        {renderMemberDrawer()}
      </Drawer>

      {/* 6. 会议详情 Drawer */}
      <Drawer
        title="会议详情"
        placement="right"
        width={520}
        open={!!drawerMeeting}
        onClose={() => setDrawerMeetingId(null)}
        styles={{ body: { padding: 20, background: surface.bg } }}
      >
        {renderMeetingDrawer()}
      </Drawer>
    </div>
  );
};

export default TeamCollaboration;
