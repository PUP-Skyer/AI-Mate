/**
 * 专家端主页面
 * 分为创意组、出场组两个功能模块
 */

import React, { useState } from 'react';
import { Card, Tag, Button, Avatar, Badge, Progress, Row, Col, Statistic, Rate } from 'antd';
import { BulbOutlined, TrophyOutlined, TeamOutlined, StarOutlined, CheckCircleOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';

interface Project {
  id: string;
  name: string;
  group: 'creative' | 'pitch';
  team: string;
  members: number;
  score: number;
  status: 'pending' | 'reviewing' | 'completed';
  description: string;
  tags: string[];
  expertScore?: number;
  feedback?: string;
}

const groupConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  creative: { label: '创意组', color: '#1890ff', icon: <BulbOutlined />, description: '评估项目创意与创新性' },
  pitch: { label: '出场组', color: '#faad14', icon: <TrophyOutlined />, description: '评估路演表现与商业计划' },
};

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'AI智能客服系统',
    group: 'creative',
    team: '创新者联盟',
    members: 4,
    score: 85,
    status: 'completed',
    description: '基于大语言模型的智能客服解决方案，支持多轮对话和情感分析',
    tags: ['AI', '客服', 'NLP'],
    expertScore: 88,
    feedback: '创意新颖，技术方案可行，建议加强数据安全设计',
  },
  {
    id: '2',
    name: '校园共享储物柜',
    group: 'creative',
    team: '校园创客',
    members: 3,
    score: 72,
    status: 'reviewing',
    description: '基于物联网的校园共享储物系统，解决学生临时存储需求',
    tags: ['物联网', '共享经济', '校园服务'],
  },
  {
    id: '3',
    name: '农产品溯源平台',
    group: 'creative',
    team: '绿源科技',
    members: 5,
    score: 90,
    status: 'completed',
    description: '区块链技术驱动的农产品全链路溯源系统',
    tags: ['区块链', '农业', '溯源'],
    expertScore: 92,
    feedback: '商业模式清晰，社会价值高，建议拓展B端市场',
  },
  {
    id: '4',
    name: '智慧养老监护',
    group: 'pitch',
    team: '银发守护者',
    members: 6,
    score: 78,
    status: 'reviewing',
    description: 'AI驱动的老年人健康监护与紧急救援系统',
    tags: ['AI', '养老', '健康'],
  },
  {
    id: '5',
    name: '环保材料研发',
    group: 'pitch',
    team: '绿色未来',
    members: 4,
    score: 88,
    status: 'completed',
    description: '可降解生物材料的研发与产业化',
    tags: ['新材料', '环保', '生物降解'],
    expertScore: 85,
    feedback: '技术壁垒高，市场前景广阔，需关注成本控制',
  },
  {
    id: '6',
    name: '在线教育平台',
    group: 'pitch',
    team: '知识星球',
    members: 5,
    score: 82,
    status: 'pending',
    description: 'AI个性化推荐的在线教育平台，覆盖K12到职业教育',
    tags: ['教育', 'AI', '个性化'],
  },
];

const ExpertPage: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<string>('creative');

  const filteredProjects = mockProjects.filter(p => p.group === activeGroup);
  const currentGroup = groupConfig[activeGroup];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge status="default" text="待评审" />;
      case 'reviewing':
        return <Badge status="processing" text="评审中" />;
      case 'completed':
        return <Badge status="success" text="已完成" />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)', minHeight: '100vh' }}>
      {/* 顶部标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1a1a2e' }}>专家评审</h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>专业评审，助力项目成长</p>
      </div>

      {/* 评审组选择 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Object.entries(groupConfig).map(([key, config]) => (
          <Col span={12} key={key}>
            <Card
              hoverable
              onClick={() => setActiveGroup(key)}
              style={{
                borderRadius: 12,
                border: activeGroup === key ? `2px solid ${config.color}` : 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}40 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {React.cloneElement(config.icon as React.ReactElement, { style: { fontSize: 28, color: config.color } })}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' }}>{config.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{config.description}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: config.color }}>
                    {mockProjects.filter(p => p.group === key).length}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>待评审项目</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="已评审"
              value={filteredProjects.filter(p => p.status === 'completed').length}
              prefix={<CheckCircleOutlined />}
              styles={{ content: {} }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="评审中"
              value={filteredProjects.filter(p => p.status === 'reviewing').length}
              prefix={<ClockCircleOutlined />}
              styles={{ content: {} }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="平均分"
              value={Math.round(filteredProjects.reduce((sum, p) => sum + p.score, 0) / (filteredProjects.length || 1))}
              suffix="分"
              prefix={<StarOutlined />}
              styles={{ content: {} }}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            hoverable
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar size={48} style={{ background: currentGroup.color }}>
                  {project.name[0]}
                </Avatar>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' }}>{project.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    <TeamOutlined style={{ marginRight: 4 }} />{project.team} · {project.members}人
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: currentGroup.color }}>{project.score}分</div>
                {getStatusBadge(project.status)}
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{project.description}</p>

            {project.expertScore && (
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <span style={{ fontWeight: 500, color: '#333' }}>专家评分: {project.expertScore}分</span>
                  <Rate disabled defaultValue={Math.round(project.expertScore / 20)} style={{ fontSize: 14 }} />
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{project.feedback}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {project.tags.map((tag, idx) => (
                  <Tag key={idx} color="blue" style={{ borderRadius: 4 }}>{tag}</Tag>
                ))}
              </div>
              <Button
                type="primary"
                icon={<MessageOutlined />}
                style={{
                  borderRadius: 8,
                  background: project.status === 'completed' ? '#52c41a' : currentGroup.color,
                  borderColor: project.status === 'completed' ? '#52c41a' : currentGroup.color,
                }}
              >
                {project.status === 'completed' ? '查看评审' : '开始评审'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExpertPage;
