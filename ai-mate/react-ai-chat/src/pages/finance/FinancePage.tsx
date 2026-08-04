/**
 * 融资端主页面
 * 展示不同融资阶段的项目列表
 */

import React, { useState } from 'react';
import { Card, Tag, Button, Avatar, Badge, Progress, Row, Col, Statistic, Empty } from 'antd';
import { RocketOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';

interface FinanceProject {
  id: string;
  name: string;
  stage: string;
  industry: string;
  amount: string;
  progress: number;
  status: 'raising' | 'closed' | 'completed';
  teamSize: number;
  description: string;
  tags: string[];
}

const stageConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  seed: { label: '种子轮', color: '#52c41a', icon: <RocketOutlined />, description: '早期项目，验证商业模式' },
  angel: { label: '天使轮', color: '#1890ff', icon: <DollarOutlined />, description: '产品初步成型，寻求天使投资' },
  preA: { label: 'Pre-A轮', color: '#faad14', icon: <ClockCircleOutlined />, description: '产品验证完成，准备规模化' },
  abc: { label: 'ABC轮', color: '#722ed1', icon: <CheckCircleOutlined />, description: '商业模式成熟，寻求扩张资金' },
};

const mockProjects: FinanceProject[] = [
  {
    id: '1',
    name: 'AI智能客服系统',
    stage: 'seed',
    industry: '人工智能',
    amount: '200万',
    progress: 75,
    status: 'raising',
    teamSize: 4,
    description: '基于大语言模型的智能客服解决方案，支持多轮对话和情感分析',
    tags: ['AI', '客服', 'NLP'],
  },
  {
    id: '2',
    name: '校园共享储物柜',
    stage: 'seed',
    industry: '物联网',
    amount: '150万',
    progress: 60,
    status: 'raising',
    teamSize: 3,
    description: '基于物联网的校园共享储物系统，解决学生临时存储需求',
    tags: ['物联网', '共享经济', '校园服务'],
  },
  {
    id: '3',
    name: '农产品溯源平台',
    stage: 'seed',
    industry: '区块链',
    amount: '300万',
    progress: 85,
    status: 'raising',
    teamSize: 5,
    description: '区块链技术驱动的农产品全链路溯源系统',
    tags: ['区块链', '农业', '溯源'],
  },
  {
    id: '4',
    name: '智慧养老监护',
    stage: 'angel',
    industry: '人工智能',
    amount: '800万',
    progress: 45,
    status: 'raising',
    teamSize: 6,
    description: 'AI驱动的老年人健康监护与紧急救援系统',
    tags: ['AI', '养老', '健康'],
  },
  {
    id: '5',
    name: '环保材料研发',
    stage: 'angel',
    industry: '新材料',
    amount: '1000万',
    progress: 70,
    status: 'raising',
    teamSize: 4,
    description: '可降解生物材料的研发与产业化',
    tags: ['新材料', '环保', '生物降解'],
  },
  {
    id: '6',
    name: '在线教育平台',
    stage: 'preA',
    industry: '教育科技',
    amount: '3000万',
    progress: 55,
    status: 'raising',
    teamSize: 5,
    description: 'AI个性化推荐的在线教育平台，覆盖K12到职业教育',
    tags: ['教育', 'AI', '个性化'],
  },
  {
    id: '7',
    name: '跨境电商SaaS',
    stage: 'abc',
    industry: '跨境电商',
    amount: '1亿',
    progress: 90,
    status: 'raising',
    teamSize: 80,
    description: '一站式跨境电商运营平台，覆盖50+国家',
    tags: ['跨境电商', 'SaaS', '全球化'],
  },
  {
    id: '8',
    name: '智慧城市大脑',
    stage: 'abc',
    industry: '智慧城市',
    amount: '2亿',
    progress: 60,
    status: 'raising',
    teamSize: 120,
    description: '城市级AI决策系统，已落地10+城市',
    tags: ['智慧城市', '大数据', 'AI决策'],
  },
];

const FinancePage: React.FC = () => {
  const [activeStage, setActiveStage] = useState<string>('seed');

  const filteredProjects = mockProjects.filter(p => p.stage === activeStage);
  const currentStage = stageConfig[activeStage];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'raising':
        return <Badge status="processing" text="融资中" />;
      case 'closed':
        return <Badge status="default" text="已关闭" />;
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
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1a1a2e' }}>融资对接</h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>连接优质项目与资本，助力创业梦想</p>
      </div>

      {/* 融资阶段选择 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Object.entries(stageConfig).map(([key, config]) => (
          <Col span={6} key={key}>
            <Card
              hoverable
              onClick={() => setActiveStage(key)}
              style={{
                borderRadius: 12,
                border: activeStage === key ? `2px solid ${config.color}` : 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              styles={{ body: { padding: '20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}40 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  {React.cloneElement(config.icon as React.ReactElement, { style: { fontSize: 24, color: config.color } })}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' }}>{config.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{config.description}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={config.color} style={{ borderRadius: 4 }}>
                  {mockProjects.filter(p => p.stage === key).length} 个项目
                </Tag>
                {activeStage === key && <CheckCircleOutlined style={{ color: config.color, fontSize: 20 }} />}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 当前阶段统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="项目数量"
              value={filteredProjects.length}
              prefix={<RocketOutlined />}
              styles={{ content: {} }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="融资总额"
              value={filteredProjects.reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, '')), 0)}
              suffix="万"
              prefix={<DollarOutlined />}
              styles={{ content: {} }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="平均进度"
              value={Math.round(filteredProjects.reduce((sum, p) => sum + p.progress, 0) / (filteredProjects.length || 1))}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              styles={{ content: {} }}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredProjects.length === 0 ? (
          <Empty description="暂无项目" />
        ) : (
          filteredProjects.map((project) => (
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
                  <Avatar size={48} style={{ background: currentStage.color }}>
                    {project.name[0]}
                  </Avatar>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' }}>{project.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{project.industry} · {project.teamSize}人团队</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: currentStage.color }}>{project.amount}</div>
                  {getStatusBadge(project.status)}
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{project.description}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>融资进度</span>
                  <span style={{ fontSize: 13, color: currentStage.color, fontWeight: 500 }}>{project.progress}%</span>
                </div>
                <Progress percent={project.progress} strokeColor={currentStage.color} showInfo={false} size="small" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {project.tags.map((tag, idx) => (
                    <Tag key={idx} color="blue" style={{ borderRadius: 4 }}>{tag}</Tag>
                  ))}
                </div>
                <Button type="primary" style={{ borderRadius: 8, background: currentStage.color, borderColor: currentStage.color }}>
                  查看详情
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FinancePage;
