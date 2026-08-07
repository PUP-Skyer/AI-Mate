/**
 * 管家AI (ButlerAI) - 项目管家
 * 4面板：用户内测 / 进度跟踪 / 资源对接 / 团队协作
 */

import React from 'react';
import { CustomerServiceOutlined } from '@ant-design/icons';
import AIRoleLayout from '../components/AIRoleLayout';
import UserBetaBoard from '../components/butler/UserBetaBoard';
import ProgressTracking from '../components/butler/ProgressTracking';
import ResourceConnect from '../components/butler/ResourceConnect';
import TeamCollaboration from '../components/butler/TeamCollaboration';

const ButlerAI: React.FC = () => {
  return (
    <AIRoleLayout
      role="butler"
      title="管家AI"
      icon={<CustomerServiceOutlined />}
      description="项目管家 - 内测管理 · 进度跟踪 · 资源对接 · 团队协作"
      panels={[
        { key: 'beta', label: '用户内测', children: <UserBetaBoard /> },
        { key: 'progress', label: '进度跟踪', children: <ProgressTracking /> },
        { key: 'resource', label: '资源对接', children: <ResourceConnect /> },
        { key: 'team', label: '团队协作', children: <TeamCollaboration /> },
      ]}
    />
  );
};

export default ButlerAI;
