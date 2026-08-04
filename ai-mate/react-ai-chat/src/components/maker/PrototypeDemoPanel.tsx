/**
 * 原型Demo展示面板
 * 单一作品详情展示：功能视频、项目信息、阶段、团队、外部链接
 */

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Button,
  Spin,
  Card,
  Empty,
  Typography,
  Divider,
  Avatar,
  Badge,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  LinkOutlined,
  GithubOutlined,
  GlobalOutlined,
  RocketOutlined,
  CodeOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

/** 项目阶段类型 */
type ProjectStage = 'seed' | 'angel' | 'series_a' | 'series_b' | 'series_c' | 'pre_ipo';

/** 团队类型 */
type TeamType = 'solo_opc' | 'team_otc';

/** 外部链接平台 */
interface PlatformLink {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

/** 团队成员信息 */
interface TeamMember {
  name: string;
  role?: string;
  avatar?: string;
}

/** Demo项目详情 */
interface DemoProject {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  demo_video_url?: string;
  demo_url?: string;
  stage: ProjectStage;
  team_type: TeamType;
  team_size: number;
  team_members?: TeamMember[];
  tech_stack?: string[];
  tags?: string[];
  links?: Record<string, string>;
  view_count: number;
  like_count: number;
  is_liked: boolean;
}

/** 阶段配置 */
const STAGE_CONFIG: Record<ProjectStage, { label: string; color: string; badge: string }> = {
  seed:     { label: '种子轮', color: '#22c55e', badge: 'green' },
  angel:    { label: '天使轮', color: '#3b82f6', badge: 'blue' },
  series_a: { label: 'A轮',   color: '#8b5cf6', badge: 'purple' },
  series_b: { label: 'B轮',   color: '#f59e0b', badge: 'orange' },
  series_c: { label: 'C轮',   color: '#ef4444', badge: 'red' },
  pre_ipo:  { label: 'Pre-IPO', color: '#ec4899', badge: 'pink' },
};

/** 团队类型配置 */
const TEAM_CONFIG: Record<TeamType, { label: string; icon: React.ReactNode; desc: string }> = {
  solo_opc: {
    label: '个人开发者 (OPC)',
    icon: <UserOutlined />,
    desc: '独立开发者独自完成产品设计与开发',
  },
  team_otc: {
    label: '团队协作 (OTC)',
    icon: <TeamOutlined />,
    desc: '多人团队协作完成',
  },
};

/** 外部链接平台配置 */
const LINK_PLATFORMS: PlatformLink[] = [
  { key: 'github',      label: 'GitHub',      icon: <GithubOutlined />,  color: '#24292f' },
  { key: 'gitee',       label: 'Gitee',       icon: <CodeOutlined />,    color: '#c71d23' },
  { key: 'douyin',      label: '抖音',        icon: <PlayCircleOutlined />, color: '#000000' },
  { key: 'bilibili',    label: '哔哩哔哩',     icon: <PlayCircleOutlined />, color: '#fb7299' },
  { key: 'x',           label: 'X',           icon: <GlobalOutlined />,  color: '#0f1419' },
  { key: 'xiaohongshu', label: '小红书',       icon: <GlobalOutlined />,  color: '#fe2c55' },
  { key: 'website',     label: '官网',        icon: <LinkOutlined />,    color: '#10b981' },
];

/** 模拟数据 */
const MOCK_DEMO: DemoProject = {
  id: 1,
  title: '青宸智汇 大学生创业智能体平台',
  description: '基于AI Agent技术的一站式大学生创业服务平台，集成探路者AI、军师AI、工匠AI、管家AI四大智能体角色，提供市场分析、创业规划、技能库、项目管理等全方位创业支持。支持原型Demo展示、作品管理、资源对接等功能，帮助大学生从0到1实现创业梦想。',
  cover_image: 'https://picsum.photos/seed/aimate/800/450',
  demo_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  demo_url: 'https://aimate.demo',
  stage: 'angel',
  team_type: 'team_otc',
  team_size: 4,
  team_members: [
    { name: '张三', role: '产品负责人' },
    { name: '李四', role: '前端开发' },
    { name: '王五', role: '后端开发' },
    { name: '赵六', role: 'UI设计师' },
  ],
  tech_stack: ['React 19', 'TypeScript', 'Node.js', 'MySQL', 'Zustand', 'Ant Design'],
  tags: ['AI Agent', '创业服务', '大学生', '智能体'],
  links: {
    github: 'https://github.com/example/ai-mate',
    gitee: 'https://gitee.com/example/ai-mate',
    bilibili: 'https://space.bilibili.com/example',
    xiaohongshu: 'https://www.xiaohongshu.com/user/example',
  },
  view_count: 1280,
  like_count: 86,
  is_liked: false,
};

/** 获取项目详情 */
const fetchDemoDetail = async (demoId: number): Promise<DemoProject> => {
  const res = await fetch(`http://localhost:8080/api/demos/${demoId}`);
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.message);
  return data.data;
};

/** 原型Demo展示面板 */
const PrototypeDemoPanel: React.FC = () => {
  const [detail, setDetail] = useState<DemoProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchDemoDetail(1)
      .then((data) => {
        setDetail(data);
        setLiked(data.is_liked);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载作品详情..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <Empty
        description="暂无作品展示"
        style={{ marginTop: 80 }}
      />
    );
  }

  const stageConfig = STAGE_CONFIG[detail.stage];
  const teamConfig = TEAM_CONFIG[detail.team_type];

  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '24px 20px 40px',
      }}
    >
      {/* ===== 1. 功能演示视频 ===== */}
      {detail.demo_video_url && (
        <Card
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 24,
            border: '1px solid var(--border-light)',
            background: 'var(--bg-glass)',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <video
            src={detail.demo_video_url}
            controls
            poster={detail.cover_image}
            style={{
              width: '100%',
              display: 'block',
              aspectRatio: '16/9',
              background: '#000',
            }}
          />
        </Card>
      )}

      {/* ===== 2. 项目名称 + 阶段标签 ===== */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {detail.title}
          </Title>
          <Badge.Ribbon
            text={stageConfig.label}
            color={stageConfig.color}
            style={{ display: 'none' }}
          >
            <Tag
              color={stageConfig.badge}
              style={{ fontSize: 13, fontWeight: 600, padding: '2px 10px', borderRadius: 6 }}
            >
              <RocketOutlined style={{ marginRight: 4 }} />
              {stageConfig.label}
            </Tag>
          </Badge.Ribbon>
        </div>

        {/* 浏览量 + 点赞 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          <span>{detail.view_count.toLocaleString()} 次浏览</span>
          <Button
            type="text"
            size="small"
            onClick={() => setLiked(!liked)}
            style={{ color: liked ? '#ef4444' : 'var(--text-muted)' }}
          >
            {liked ? '♥' : '♡'} {detail.like_count + (liked ? 1 : 0)}
          </Button>
        </div>
      </div>

      {/* ===== 3. 技术栈标签 ===== */}
      {detail.tech_stack && detail.tech_stack.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {detail.tech_stack.map((tech) => (
              <Tag
                key={tech}
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  borderColor: 'rgba(16,185,129,0.2)',
                  color: '#10b981',
                  borderRadius: 6,
                }}
              >
                {tech}
              </Tag>
            ))}
          </div>
        </div>
      )}

      <Divider style={{ borderColor: 'var(--border-light)', margin: '20px 0' }} />

      {/* ===== 4. 项目简介 ===== */}
      <div style={{ marginBottom: 28 }}>
        <Title level={5} style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
          项目简介
        </Title>
        <Paragraph
          style={{
            lineHeight: 1.9,
            color: 'var(--text-secondary)',
            fontSize: 14,
            margin: 0,
          }}
        >
          {detail.description}
        </Paragraph>
      </div>

      {/* ===== 5. 项目阶段 ===== */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 20,
          border: '1px solid var(--border-light)',
          background: 'var(--bg-glass)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${stageConfig.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: stageConfig.color,
              flexShrink: 0,
            }}
          >
            <RocketOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 15, display: 'block' }}>
              当前阶段：{stageConfig.label}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {detail.stage === 'seed' && '项目处于概念验证阶段，正在寻找种子用户'}
              {detail.stage === 'angel' && '产品已上线，获得天使投资，正在快速迭代'}
              {detail.stage === 'series_a' && '商业模式已验证，进入规模化增长阶段'}
              {detail.stage === 'series_b' && '市场份额稳步提升，拓展新业务线'}
              {detail.stage === 'series_c' && '行业头部地位，准备上市或并购'}
              {detail.stage === 'pre_ipo' && '上市前准备阶段，完善公司治理结构'}
            </Text>
          </div>
        </div>
      </Card>

      {/* ===== 6. 团队情况 ===== */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 20,
          border: '1px solid var(--border-light)',
          background: 'var(--bg-glass)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Title level={5} style={{ marginBottom: 14, fontSize: 15, fontWeight: 600 }}>
          团队情况
        </Title>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(139,92,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#8b5cf6',
              flexShrink: 0,
            }}
          >
            {teamConfig.icon}
          </div>
          <div>
            <Text strong style={{ fontSize: 15, display: 'block' }}>
              {teamConfig.label}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {teamConfig.desc}
              {detail.team_type === 'team_otc' && detail.team_size > 0 && ` · ${detail.team_size}人`}
            </Text>
          </div>
        </div>

        {/* OTC团队成员列表 */}
        {detail.team_type === 'team_otc' && detail.team_members && detail.team_members.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingLeft: 58 }}>
            {detail.team_members.map((member, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <Avatar size={28} icon={<UserOutlined />} style={{ background: '#8b5cf6', fontSize: 12 }} />
                <div>
                  <Text strong style={{ fontSize: 13 }}>{member.name}</Text>
                  {member.role && (
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                      {member.role}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ===== 7. 外部链接 ===== */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid var(--border-light)',
          background: 'var(--bg-glass)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Title level={5} style={{ marginBottom: 14, fontSize: 15, fontWeight: 600 }}>
          外部链接
        </Title>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {LINK_PLATFORMS.map((platform) => {
            const url = detail.links?.[platform.key];
            if (!url) return null;
            return (
              <a
                key={platform.key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: `${platform.color}12`,
                  border: `1px solid ${platform.color}25`,
                  color: platform.color,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${platform.color}20`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${platform.color}12`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 15 }}>{platform.icon}</span>
                <span>{platform.label}</span>
              </a>
            );
          })}
          {!detail.links || Object.keys(detail.links).length === 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>暂无外部链接</Text>
          ) : null}
        </div>
      </Card>

      {/* ===== 8. 在线体验入口 ===== */}
      {detail.demo_url && (
        <Button
          type="primary"
          size="large"
          block
          href={detail.demo_url}
          target="_blank"
          icon={<RocketOutlined />}
          style={{
            height: 48,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
          }}
        >
          在线体验 Demo
        </Button>
      )}
    </div>
  );
};

export default PrototypeDemoPanel;
