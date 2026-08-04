/**
 * 管家AI - 资源对接面板
 */

import React from 'react';
import AIGeneratorForm from '../AIGeneratorForm';

const ResourceConnect: React.FC = () => (
  <AIGeneratorForm
    title="资源对接"
    fields={[
      { name: 'resourceType', label: '资源类型', placeholder: '如：技术合伙人、投资人、渠道资源、办公场地...', required: true },
      { name: 'projectStage', label: '项目阶段', placeholder: '如：种子轮、天使轮、A轮...', required: true },
      { name: 'industry', label: '所属行业', placeholder: '如：人工智能、电商、教育...', required: true },
      { name: 'location', label: '所在地区', placeholder: '如：北京、上海、深圳、杭州...', required: true },
    ]}
    systemPrompt={`你是一位资源对接专家，擅长为大学生创业团队匹配优质资源。请根据提供的信息，推荐合适的资源对接方案（Markdown格式）。

输出结构：
# 资源对接方案

## 一、推荐资源列表
- 资源名称、类型、匹配理由、对接方式

## 二、对接渠道建议
- 线上平台、线下活动、人脉推荐

## 三、对接话术模板
- 初次联系邮件/消息模板

## 四、注意事项
- 资源对接中的常见陷阱和防范建议`}
    resultTitle="资源对接方案"
    generateLabel="推荐资源"
  />
);

export default ResourceConnect;
