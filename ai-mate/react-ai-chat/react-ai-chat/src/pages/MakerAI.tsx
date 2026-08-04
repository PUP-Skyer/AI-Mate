/**
 * 工匠AI (MakerAI) - 内容创作与项目构建
 * 5面板：项目脚手架 / PPT大纲 / 产品文档 / 原型描述 / 原型Demo
 */

import React from 'react';
import { ToolOutlined } from '@ant-design/icons';
import AIRoleLayout from '../components/AIRoleLayout';
import ProjectScaffold from '../components/maker/ProjectScaffold';
import PPTOutline from '../components/maker/PPTOutline';
import ProductDoc from '../components/maker/ProductDoc';
import PrototypeDesc from '../components/maker/PrototypeDesc';
import PrototypeDemoPanel from '../components/maker/PrototypeDemoPanel';

const MakerAI: React.FC = () => {
  return (
    <AIRoleLayout
      role="maker"
      title="工匠AI"
      icon={<ToolOutlined />}
      description="内容创作专家 - 创意无限的文案生成与项目构建"
      panels={[
        { key: 'scaffold', label: '项目脚手架', children: <ProjectScaffold /> },
        { key: 'ppt', label: 'PPT大纲', children: <PPTOutline /> },
        { key: 'doc', label: '产品文档', children: <ProductDoc /> },
        { key: 'proto', label: '原型描述', children: <PrototypeDesc /> },
        { key: 'demo', label: '原型Demo', children: <PrototypeDemoPanel /> },
      ]}
    />
  );
};

export default MakerAI;
