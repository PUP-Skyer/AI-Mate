/**
 * 管家AI 面板叁 · 资源对接
 * ----------------------------------------------------------------
 * - 投资股东 / 合伙人 分区式卡片陈列
 * - AI 资源匹配度评分（MatchScoreRing 环形图）
 * - AI 智能推荐：根据资源需求调用 chatWithZhipu 生成资源列表
 */

import './butler-animations.css';
import React, { useState, useEffect, useMemo } from 'react';
import { Input, Button, Tag, Select, Spin, message } from 'antd';
import { RobotOutlined, EnvironmentOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import { BUTLER_PALETTE, BUTLER_FONTS, BUTLER_SHADOWS, BUTLER_SURFACES } from './butler-theme';
import { ButlerSection, ButlerStatCard, ButlerLoadingSkeleton } from './shared';
import MatchScoreRing from './svg/MatchScoreRing';
import { loadResources, saveResources, genId, type ResourceCard } from './butler-storage';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';

// ─── 常量 ────────────────────────────────────────────────────

/** 资源类型元信息：标签 + 图标 + 主题色 */
const TYPE_META: Record<ResourceCard['type'], { label: string; icon: React.ReactNode }> = {
  investor: { label: '投资股东', icon: <DollarOutlined /> },
  partner: { label: '合伙人', icon: <TeamOutlined /> },
};

/** 状态元信息：标签 + 颜色 + Tag色 */
const STATUS_META: Record<
  ResourceCard['status'],
  { label: string; color: string; tagColor: string }
> = {
  pending: { label: '待联系', color: '#8c8c8c', tagColor: 'default' },
  contacted: { label: '已联系', color: '#1890ff', tagColor: 'processing' },
  negotiating: { label: '洽谈中', color: '#faad14', tagColor: 'warning' },
  confirmed: { label: '已确认', color: '#52c41a', tagColor: 'success' },
};

/** 状态选择器选项 */
const STATUS_OPTIONS: { value: ResourceCard['status']; label: string }[] = [
  { value: 'pending', label: '待联系' },
  { value: 'contacted', label: '已联系' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'confirmed', label: '已确认' },
];

/** AI 推荐表单字段配置 */
const FORM_FIELDS: {
  key: 'resourceType' | 'projectStage' | 'industry' | 'location';
  label: string;
  placeholder: string;
  prefix?: React.ReactNode;
}[] = [
  { key: 'resourceType', label: '资源类型', placeholder: '如：技术合伙人、投资人、渠道资源...', prefix: <RobotOutlined /> },
  { key: 'projectStage', label: '项目阶段', placeholder: '如：种子轮、天使轮、A轮...', prefix: <DollarOutlined /> },
  { key: 'industry', label: '所属行业', placeholder: '如：人工智能、电商、教育...', prefix: <TeamOutlined /> },
  { key: 'location', label: '所在地区', placeholder: '如：北京、上海、深圳、杭州...', prefix: <EnvironmentOutlined /> },
];

// ─── 组件 ────────────────────────────────────────────────────

const ResourceConnect: React.FC = () => {
  // 暗色模式
  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const surface = isDark ? BUTLER_SURFACES.dark : BUTLER_SURFACES.light;
  const theme = BUTLER_PALETTE.resource;

  // ─── 数据状态 ──────────────────────────────────────────────
  const [resources, setResources] = useState<ResourceCard[]>(() => loadResources());
  const [generating, setGenerating] = useState(false);

  // ─── AI 推荐表单 ───────────────────────────────────────────
  const [resourceType, setResourceType] = useState('');
  const [projectStage, setProjectStage] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');

  // ─── 跨标签页同步 storage 变化 ─────────────────────────────
  useEffect(() => {
    const handler = () => setResources(loadResources());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ─── 聚合统计（useMemo 实时计算） ──────────────────────────
  const stats = useMemo(() => {
    const investors = resources.filter((r) => r.type === 'investor');
    const partners = resources.filter((r) => r.type === 'partner');
    const confirmed = resources.filter((r) => r.status === 'confirmed');
    const avgMatch = resources.length
      ? Math.round(resources.reduce((sum, r) => sum + r.matchScore, 0) / resources.length)
      : 0;
    return {
      investorCount: investors.length,
      partnerCount: partners.length,
      avgMatch,
      confirmedCount: confirmed.length,
    };
  }, [resources]);

  // ─── 分区数据 ──────────────────────────────────────────────
  const investors = useMemo(
    () => resources.filter((r) => r.type === 'investor'),
    [resources],
  );
  const partners = useMemo(
    () => resources.filter((r) => r.type === 'partner'),
    [resources],
  );

  // ─── 状态变更持久化 ────────────────────────────────────────
  const handleStatusChange = (id: string, status: ResourceCard['status']) => {
    const newResources = resources.map((r) => (r.id === id ? { ...r, status } : r));
    setResources(newResources);
    saveResources(newResources);
  };

  // ─── AI 推荐资源 ──────────────────────────────────────────
  const recommendResources = async () => {
    if (!resourceType.trim() && !projectStage.trim() && !industry.trim() && !location.trim()) {
      message.warning('请至少填写一项资源需求信息');
      return;
    }

    setGenerating(true);
    try {
      const res = await chatWithZhipu(
        [
          {
            role: 'user',
            content: `资源需求：类型=${resourceType}, 阶段=${projectStage}, 行业=${industry}, 地区=${location}`,
          },
        ],
        {
          system_prompt:
            '你是一位资源对接专家。根据项目信息，推荐投资人和合伙人资源。输出JSON数组：[{name,type,category,matchScore,matchReason,contactMethod,description,tags,status}]，至少4个资源（2个investor + 2个partner）。type只能是investor或partner，status只能是pending',
        },
      );

      if (res.error) {
        message.error(`AI 推荐失败：${res.error}`);
        return;
      }

      const content = res.data?.choices?.[0]?.message?.content || '';
      if (!content) {
        message.warning('AI 未返回有效内容');
        return;
      }

      // 正则提取 JSON 数组
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) {
        message.warning('AI 返回内容无法解析为资源列表');
        return;
      }

      let parsed: unknown[];
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        message.warning('AI 返回的 JSON 格式有误');
        return;
      }

      const newResources: ResourceCard[] = (parsed as Record<string, unknown>[])
        .filter((item) => item && (item.type === 'investor' || item.type === 'partner'))
        .map((item) => ({
          id: genId(),
          name: String(item.name ?? '未命名资源'),
          type: item.type as ResourceCard['type'],
          category: String(item.category ?? ''),
          matchScore: Number(item.matchScore) || 0,
          matchReason: String(item.matchReason ?? ''),
          contactMethod: String(item.contactMethod ?? ''),
          description: String(item.description ?? ''),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          status: 'pending' as ResourceCard['status'],
          createdAt: Date.now(),
        }));

      if (newResources.length === 0) {
        message.warning('AI 未生成有效资源');
        return;
      }

      // 新推荐资源置顶合并
      const merged = [...newResources, ...resources];
      setResources(merged);
      saveResources(merged);
      message.success(`AI 已推荐 ${newResources.length} 个资源`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 调用失败';
      message.error(`AI 推荐失败：${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  // ─── 渲染：资源卡片 ────────────────────────────────────────
  const renderResourceCard = (r: ResourceCard, index: number) => {
    const typeMeta = TYPE_META[r.type];
    const statusMeta = STATUS_META[r.status];
    // 交错动画延迟（0.06s 递增，上限 9）
    const staggerClass = `butler-stagger-${Math.min(index + 1, 9)}`;

    return (
      <div
        key={r.id}
        className={`butler-card-rise ${staggerClass}`}
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
          gap: 10,
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
        {/* 顶部：名称 + 匹配度环形图 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: surface.text,
                fontFamily: BUTLER_FONTS.heading,
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {r.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {/* 类型标签 */}
              <Tag
                color={r.type === 'investor' ? theme.accent : theme.secondary}
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {typeMeta.icon}
                {typeMeta.label}
              </Tag>
              {/* 分类标签 */}
              {r.category && (
                <Tag
                  style={{
                    margin: 0,
                    borderRadius: 999,
                    fontSize: 11,
                    color: surface.textSecondary,
                    borderColor: surface.border,
                  }}
                >
                  {r.category}
                </Tag>
              )}
            </div>
          </div>
          {/* 右上角匹配度环形图 */}
          <div style={{ flexShrink: 0 }}>
            <MatchScoreRing score={r.matchScore} size={56} />
          </div>
        </div>

        {/* 匹配理由 */}
        {r.matchReason && (
          <div
            style={{
              fontSize: 12,
              color: surface.text,
              lineHeight: 1.6,
              fontFamily: BUTLER_FONTS.body,
              background: isDark ? 'rgba(245,34,45,0.06)' : 'rgba(245,34,45,0.04)',
              borderRadius: 8,
              padding: '8px 10px',
              borderLeft: `3px solid ${theme.accent}`,
            }}
          >
            <span style={{ fontWeight: 600, color: theme.accent }}>匹配理由：</span>
            {r.matchReason}
          </div>
        )}

        {/* 对接方式 */}
        {r.contactMethod && (
          <div
            style={{
              fontSize: 12,
              color: surface.textSecondary,
              lineHeight: 1.6,
              fontFamily: BUTLER_FONTS.body,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <span style={{ fontWeight: 600, color: surface.text, flexShrink: 0 }}>对接方式：</span>
            <span style={{ wordBreak: 'break-word' }}>{r.contactMethod}</span>
          </div>
        )}

        {/* 底部：状态选择器 + 标签 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 'auto',
            paddingTop: 4,
            flexWrap: 'wrap',
          }}
        >
          <Select
            value={r.status}
            onChange={(value) => handleStatusChange(r.id, value)}
            size="small"
            style={{ width: 110 }}
            options={STATUS_OPTIONS}
            suffixIcon={
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusMeta.color,
                }}
              />
            }
          />
          {/* 标签 */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {r.tags.slice(0, 3).map((tag, i) => (
              <Tag
                key={i}
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontSize: 11,
                  color: surface.textSecondary,
                  borderColor: surface.border,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── 渲染：分区卡片网格 ────────────────────────────────────
  const renderSection = (
    title: string,
    subtitle: string,
    no: string,
    icon: React.ReactNode,
    list: ResourceCard[],
  ) => {
    if (generating && list.length === 0) {
      return (
        <ButlerSection no={no} title={title} subtitle={subtitle} accent={theme.accent}>
          <ButlerLoadingSkeleton mode="cards" accent={theme.accent} rows={3} />
        </ButlerSection>
      );
    }

    if (list.length === 0) {
      return (
        <ButlerSection no={no} title={title} subtitle={subtitle} accent={theme.accent}>
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              fontSize: 12,
              color: surface.textSecondary,
              fontFamily: BUTLER_FONTS.body,
              borderRadius: 10,
              background: surface.surface,
              border: `1px dashed ${surface.border}`,
            }}
          >
            <span style={{ fontSize: 22, display: 'block', marginBottom: 8, opacity: 0.5 }}>
              {icon}
            </span>
            暂无{title}资源，点击顶部「AI推荐资源」生成
          </div>
        </ButlerSection>
      );
    }

    return (
      <ButlerSection no={no} title={title} subtitle={subtitle} accent={theme.accent}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {list.map((r, i) => renderResourceCard(r, i))}
        </div>
      </ButlerSection>
    );
  };

  // ─── 渲染主体 ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. 顶部头部：徽章「叁」+ 标题 */}
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
          叁
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
            资源对接
          </h2>
          <span style={{ fontSize: 12, color: surface.textSecondary }}>
            投资股东与合伙人智能匹配 · AI 资源匹配度评分
          </span>
        </div>
      </header>

      {/* 2. AI 推荐表单：4 个输入框 + 推荐按钮 */}
      <div
        className="butler-fade-in-up butler-stagger-1"
        style={{
          padding: 16,
          borderRadius: 12,
          background: surface.surface,
          border: `1px solid ${surface.border}`,
          boxShadow: BUTLER_SHADOWS.card,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
            fontSize: 13,
            fontWeight: 700,
            color: theme.accent,
            fontFamily: BUTLER_FONTS.heading,
          }}
        >
          <RobotOutlined />
          AI 资源智能推荐
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {FORM_FIELDS.map((field) => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                style={{
                  fontSize: 11,
                  color: surface.textSecondary,
                  fontFamily: BUTLER_FONTS.body,
                  letterSpacing: 0.3,
                }}
              >
                {field.label}
              </label>
              <Input
                value={
                  field.key === 'resourceType'
                    ? resourceType
                    : field.key === 'projectStage'
                      ? projectStage
                      : field.key === 'industry'
                        ? industry
                        : location
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (field.key === 'resourceType') setResourceType(v);
                  else if (field.key === 'projectStage') setProjectStage(v);
                  else if (field.key === 'industry') setIndustry(v);
                  else setLocation(v);
                }}
                placeholder={field.placeholder}
                prefix={field.prefix}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={generating ? <Spin size="small" /> : <RobotOutlined />}
            loading={generating}
            onClick={recommendResources}
            style={{
              borderRadius: 999,
              background: theme.gradient,
              borderColor: theme.accent,
            }}
          >
            {generating ? '推荐中...' : 'AI推荐资源'}
          </Button>
        </div>
      </div>

      {/* 3. 统计行：4 个 ButlerStatCard */}
      <div
        className="butler-fade-in-up butler-stagger-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        <ButlerStatCard value={stats.investorCount} suffix="位" label="投资股东数" icon="💼" accent={theme.accent} />
        <ButlerStatCard value={stats.partnerCount} suffix="位" label="合伙人数" icon="🤝" accent={theme.secondary} />
        <ButlerStatCard value={stats.avgMatch} suffix="分" label="平均匹配度" icon="🎯" accent="#faad14" />
        <ButlerStatCard value={stats.confirmedCount} suffix="个" label="已确认数" icon="✓" accent="#52c41a" />
      </div>

      {/* 4. 投资股东分区 */}
      {renderSection(
        '投资股东',
        `${investors.length} 位投资人 · 按匹配度智能陈列`,
        '01',
        <DollarOutlined />,
        investors,
      )}

      {/* 5. 合伙人分区 */}
      {renderSection(
        '合伙人',
        `${partners.length} 位合伙人 · 按匹配度智能陈列`,
        '02',
        <TeamOutlined />,
        partners,
      )}
    </div>
  );
};

export default ResourceConnect;
