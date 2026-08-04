/**
 * 管家AI - 进度跟踪面板
 */

import React from 'react';
import { Card, Progress, Timeline, Typography, Tag } from 'antd';

const { Title, Text } = Typography;

const ProgressTracking: React.FC = () => {
  const milestones = [
    { title: '项目立项', percent: 100, status: '已完成' as const, date: '2026-01-15' },
    { title: '需求分析', percent: 100, status: '已完成' as const, date: '2026-02-01' },
    { title: '产品设计', percent: 80, status: '进行中' as const, date: '2026-03-01' },
    { title: '技术开发', percent: 45, status: '进行中' as const, date: '2026-04-15' },
    { title: '测试上线', percent: 0, status: '待开始' as const, date: '2026-05-30' },
  ];

  const timelineItems = [
    { children: '完成项目立项和需求分析', color: 'green' },
    { children: '确定技术架构和团队分工', color: 'green' },
    { children: '完成UI/UX设计稿', color: 'blue' },
    { children: '开发核心功能模块', color: 'gray' },
    { children: '内部测试和Bug修复', color: 'gray' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成': return 'success';
      case '进行中': return 'processing';
      case '待开始': return 'default';
      default: return 'default';
    }
  };

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>项目里程碑</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {milestones.map((m) => (
          <Card key={m.title} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong>{m.title}</Text>
              <Tag color={getStatusColor(m.status)}>{m.status}</Tag>
            </div>
            <Progress percent={m.percent} size="small" status={m.percent === 100 ? 'success' : 'active'} />
            <Text type="secondary" style={{ fontSize: 12 }}>目标日期: {m.date}</Text>
          </Card>
        ))}
      </div>

      <Title level={5} style={{ marginBottom: 16 }}>项目时间线</Title>
      <Timeline items={timelineItems} />
    </div>
  );
};

export default ProgressTracking;
