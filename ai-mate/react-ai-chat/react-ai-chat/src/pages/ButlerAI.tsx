/**
 * 管家AI (ButlerAI) - 客户服务
 * 4面板：任务看板 / 进度跟踪 / 资源对接 / 团队协作
 */

import React from 'react';
import { CustomerServiceOutlined } from '@ant-design/icons';
import AIRoleLayout from '../components/AIRoleLayout';
import TaskBoard from '../components/butler/TaskBoard';
import ProgressTracking from '../components/butler/ProgressTracking';
import ResourceConnect from '../components/butler/ResourceConnect';
import TeamCollaboration from '../components/butler/TeamCollaboration';

const ButlerAI: React.FC = () => {
  return (
    <AIRoleLayout
      role="butler"
      title="管家AI"
      icon={<CustomerServiceOutlined />}
      description="客户服务管家 - 贴心专业的服务支持"
      panels={[
        { key: 'tasks', label: '任务看板', children: <TaskBoard /> },
        { key: 'progress', label: '进度跟踪', children: <ProgressTracking /> },
        { key: 'resource', label: '资源对接', children: <ResourceConnect /> },
        { key: 'team', label: '团队协作', children: <TeamCollaboration /> },
      ]}
    />
  );
};

export default ButlerAI;
