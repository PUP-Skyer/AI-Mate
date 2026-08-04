/**
 * BP 商业计划书生成器
 */

import React from 'react';
import AIGeneratorForm from '../AIGeneratorForm';

const BPGenerator: React.FC = () => {
  return (
    <AIGeneratorForm
      title="BP 商业计划书生成"
      fields={[
        { name: 'projectName', label: '项目名称', placeholder: '请输入项目名称', required: true },
        { name: 'industry', label: '所属行业', placeholder: '如：人工智能、电商、教育...', required: true },
        { name: 'stage', label: '当前阶段', placeholder: '如：种子轮、天使轮、A轮...', required: true },
        { name: 'description', label: '项目描述', placeholder: '简要描述项目核心功能和亮点...', required: true },
      ]}
      systemPrompt={`你是一位专业的商业计划书撰写专家，擅长为大学生创业项目撰写BP。请根据提供的信息，生成一份结构完整、逻辑清晰的商业计划书（Markdown格式）。

输出结构：
# 商业计划书

## 一、项目概述
## 二、市场分析
## 三、产品介绍
## 四、商业模式
## 五、竞争分析
## 六、团队介绍
## 七、财务预测
## 八、融资计划`}
      resultTitle="生成的商业计划书"
      generateLabel="生成 BP"
    />
  );
};

export default BPGenerator;
