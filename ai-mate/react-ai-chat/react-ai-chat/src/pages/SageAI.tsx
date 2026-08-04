/**
 * 军师AI (SageAI) - 运营策略
 * 5面板：需求分析 / 商业模式画布 / 风险矩阵 / 融资规划 / 项目计划
 */

import React from 'react';
import { BulbOutlined } from '@ant-design/icons';
import AIRoleLayout from '../components/AIRoleLayout';
import RequirementsAnalysis from '../components/sage/RequirementsAnalysis';
import BusinessModelCanvas from '../components/sage/BusinessModelCanvas';
import RiskMatrix from '../components/sage/RiskMatrix';
import FinancingPlan from '../components/sage/FinancingPlan';
import ProjectPlan from '../components/sage/ProjectPlan';

const SageAI: React.FC = () => {
  return (
    <AIRoleLayout
      role="sage"
      title="军师AI"
      icon={<BulbOutlined />}
      description="运营策略顾问 - 数据驱动的决策支持"
      panels={[
        { key: 'requirements', label: '需求分析', children: <RequirementsAnalysis /> },
        { key: 'canvas', label: '商业模式画布', children: <BusinessModelCanvas /> },
        { key: 'risk', label: '风险矩阵', children: <RiskMatrix /> },
        { key: 'finance', label: '融资规划', children: <FinancingPlan /> },
        { key: 'plan', label: '项目计划', children: <ProjectPlan /> },
      ]}
    />
  );
};

export default SageAI;
