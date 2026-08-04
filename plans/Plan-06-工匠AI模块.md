# 工匠AI模块 实施计划

> **目标：** 实现工匠AI的BP生成、路演PPT大纲、产品文档、原型描述四大核心功能，为大学生创业者提供一站式内容创作工具。
>
> **依赖：** Plan-01（项目基础架构）、Plan-02（API真实化）、Plan-03（AI模型集成）
>
> **技术栈：** React 19 + TypeScript + Ant Design 6 + Zustand + 智谱GLM流式接口 + Markdown渲染 + 文件导出

---

## 模块概述

工匠AI（MakerAI）定位为"内容创作专家"，为大学生创业者自动生成BP、PPT大纲、产品文档等创业必备材料。本计划在现有 `src/components/maker/` 目录基础上，新增4个核心面板并整合到 `MakerAI.tsx` 页面中。

### 现有代码基础

| 文件路径 | 说明 |
|---------|------|
| `src/pages/MakerAI.tsx` | 工匠AI主页面，已接入 ChatLayout，含九大创业方向技能库 |
| `src/components/maker/WorkBoard.tsx` | 现有工作看板组件 |
| `src/components/maker/ContentGenerationPanel.tsx` | 现有内容生成面板 |
| `src/services/makerService.ts` | 工匠AI服务层 |
| `src/services/aiService.ts` | AI服务层，已有 `chatWithZhipuStream` |
| `src/utils/reportStorage.ts` | 报告本地存储工具 |

### 子菜单规划（需更新 App.tsx）

```typescript
const makerSubs: SubMenuItem[] = [
  { key: 'bp', label: 'BP生成器' },        // 任务1
  { key: 'ppt', label: '路演PPT大纲' },     // 任务2
  { key: 'product_doc', label: '产品文档' }, // 任务3
  { key: 'prototype', label: '原型描述' },   // 任务4
];
```

---

### 任务1：创建BP生成器组件

**文件：** Create `src/components/maker/BPGenerator.tsx`

**目标：** 提供模板选择、数据源勾选、大纲预览，AI流式生成完整商业计划书。

- [ ] 步骤1：定义BP模板和数据源类型

```typescript
// src/components/maker/BPGenerator.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Checkbox, Steps, message, Tooltip, Space, Modal,
} from 'antd';
import {
  FileTextOutlined, ThunderboltOutlined, DownloadOutlined, EyeOutlined,
  CheckCircleOutlined, EditOutlined, SaveOutlined, CopyOutlined,
  RocketOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * BP模板类型
 */
interface BPTemplate {
  key: string;
  name: string;
  icon: string;
  description: string;
  sections: string[];   // 包含的章节
  estimatedWords: number;
}

/**
 * BP数据源（可勾选的输入信息）
 */
interface BPDataSource {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

/**
 * BP生成状态
 */
interface BPGenerationState {
  content: string;
  isStreaming: boolean;
  error: string | null;
  currentSection: string;
}

// BP模板配置
const bpTemplates: BPTemplate[] = [
  {
    key: 'standard',
    name: '标准商业计划书',
    icon: '📄',
    description: '完整版BP，适合融资路演',
    sections: ['执行摘要', '公司介绍', '市场分析', '产品与服务', '商业模式', '竞争分析', '营销策略', '团队介绍', '财务预测', '融资计划'],
    estimatedWords: 8000,
  },
  {
    key: 'lean',
    name: '精益创业计划',
    icon: '📋',
    description: '精简版，适合早期验证',
    sections: ['问题与解决方案', '价值主张', '目标客户', '商业模式', '竞争壁垒', '执行计划'],
    estimatedWords: 3000,
  },
  {
    key: 'pitch',
    name: '路演精简版',
    icon: '🎯',
    description: '极简版，5分钟路演用',
    sections: ['一句话介绍', '市场机会', '产品亮点', '商业模式', '团队', '融资需求'],
    estimatedWords: 1500,
  },
  {
    key: 'competition',
    name: '大赛参赛版',
    icon: '🏆',
    description: '创业大赛专用格式',
    sections: ['项目背景', '创新点', '市场前景', '技术方案', '商业模式', '团队实力', '社会价值', '未来规划'],
    estimatedWords: 5000,
  },
];

// 数据源配置
const dataSources: BPDataSource[] = [
  { key: 'project_name', label: '项目名称', description: '你的项目/公司名称', required: true },
  { key: 'industry', label: '所属行业', description: '项目所在的行业领域', required: true },
  { key: 'target_users', label: '目标用户', description: '目标客户群体描述', required: false },
  { key: 'problem', label: '解决的问题', description: '用户痛点和你解决的问题', required: false },
  { key: 'solution', label: '解决方案', description: '你的产品/服务如何解决问题', required: false },
  { key: 'business_model', label: '盈利模式', description: '如何赚钱、收入来源', required: false },
  { key: 'team', label: '团队信息', description: '核心成员背景和分工', required: false },
  { key: 'competitors', label: '竞品信息', description: '主要竞争对手和差异化', required: false },
  { key: 'financials', label: '财务数据', description: '已有收入、成本、预测', required: false },
  { key: 'funding', label: '融资需求', description: '融资金额和用途', required: false },
];
```

- [ ] 步骤2：实现BP生成核心逻辑

```typescript
const BPGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [checkedSources, setCheckedSources] = useState<string[]>(['project_name', 'industry']);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generation, setGeneration] = useState<BPGenerationState>({
    content: '',
    isStreaming: false,
    error: null,
    currentSection: '',
  });
  const [previewVisible, setPreviewVisible] = useState(false);
  const aiContentRef = useRef('');

  const currentTemplate = bpTemplates.find(t => t.key === selectedTemplate)!;

  // 切换数据源勾选
  const handleSourceToggle = (key: string) => {
    setCheckedSources(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  /**
   * AI流式生成BP
   */
  const handleGenerateBP = async () => {
    // 验证必填项
    const requiredSources = dataSources.filter(ds => ds.required);
    for (const ds of requiredSources) {
      if (!formData[ds.key]?.trim()) {
        message.warning(`请填写${ds.label}`);
        return;
      }
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const template = currentTemplate;

    // 构建用户输入信息
    const userInfo = checkedSources.map(key => {
      const ds = dataSources.find(d => d.key === key)!;
      return `- ${ds.label}：${formData[key] || '（未填写，请根据行业常识合理补充）'}`;
    }).join('\n');

    const systemPrompt = `${getSystemPrompt('maker')}
你是专业的商业计划书撰写专家。请根据以下信息生成一份「${template.name}」。

模板信息：
- 章节结构：${template.sections.join(' → ')}
- 预计字数：约${template.estimatedWords}字

用户输入信息：
${userInfo}

要求：
1. 严格按照模板章节结构输出，每个章节用 ## 标题标记
2. 内容专业、数据详实，用Markdown格式
3. 对于用户未填写的信息，根据行业常识合理补充（标注"建议"）
4. 每个章节内容充实，不少于200字
5. 适合大学生创业者使用，语言简洁有力

请直接开始输出BP内容，从「## 执行摘要」或第一个章节开始。`;

    setGeneration({ content: '', isStreaming: true, error: null, currentSection: template.sections[0] });
    aiContentRef.current = '';

    try {
      await chatWithZhipuStream(
        [{ role: 'user', content: `请生成「${formData.project_name || '我的项目'}」的${template.name}` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          // 检测当前章节
          const sectionMatch = aiContentRef.current.match(/## (.+)$/gm);
          const currentSection = sectionMatch ? sectionMatch[sectionMatch.length - 1].replace('## ', '') : template.sections[0];
          setGeneration({
            content: aiContentRef.current,
            isStreaming: true,
            error: null,
            currentSection,
          });
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 4000, token }
      );
      setGeneration(prev => ({ ...prev, isStreaming: false }));
      message.success('BP生成完成');
    } catch (error) {
      setGeneration({
        content: '',
        isStreaming: false,
        error: error instanceof Error ? error.message : '生成失败',
        currentSection: '',
      });
      message.error('BP生成失败，请稍后重试');
    }
  };

  /**
   * 复制BP内容
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(generation.content);
    message.success('已复制到剪贴板');
  };

  /**
   * 保存BP报告
   */
  const handleSave = () => {
    if (!generation.content) {
      message.warning('暂无可保存的内容');
      return;
    }
    saveReport({
      title: `${formData.project_name || '项目'} - ${currentTemplate.name}`,
      type: 'strategy',
      typeLabel: '商业计划书',
      content: generation.content,
    });
    message.success('BP已保存到报告库');
  };

  /**
   * 导出为Markdown文件
   */
  const handleExport = () => {
    if (!generation.content) {
      message.warning('暂无可导出的内容');
      return;
    }
    const blob = new Blob([generation.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.project_name || '商业计划书'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('BP已导出为Markdown文件');
  };
```

- [ ] 步骤3：实现完整渲染（模板选择 + 数据源表单 + 大纲预览 + 生成区）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<FileTextOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>BP生成器</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>模板选择 · 数据源 · AI流式生成</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 步骤1：选择模板 */}
        <Card title={<span><AppstoreOutlined style={{ marginRight: 8 }} />第一步：选择BP模板</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            {bpTemplates.map(template => (
              <Col span={6} key={template.key}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setSelectedTemplate(template.key)}
                  style={{
                    borderRadius: 10,
                    border: selectedTemplate === template.key ? '2px solid #10b981' : '1px solid var(--border-light)',
                    background: selectedTemplate === template.key ? 'rgba(16,185,129,0.05)' : 'transparent',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 4 }}>{template.icon}</div>
                    <Text strong style={{ fontSize: 13 }}>{template.name}</Text>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{template.description}</div>
                    <Tag style={{ marginTop: 6, fontSize: 10 }}>约{template.estimatedWords}字</Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 步骤2：数据源勾选与填写 */}
        <Card title={<span><EditOutlined style={{ marginRight: 8 }} />第二步：填写项目信息</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            {dataSources.map(ds => (
              <Col span={12} key={ds.key}>
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  border: checkedSources.includes(ds.key) ? '1px solid #10b981' : '1px solid var(--border-light)',
                  background: checkedSources.includes(ds.key) ? 'rgba(16,185,129,0.03)' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Checkbox
                      checked={checkedSources.includes(ds.key)}
                      onChange={() => handleSourceToggle(ds.key)}
                    >
                      <Text strong style={{ fontSize: 13 }}>
                        {ds.label}
                        {ds.required && <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>必填</Tag>}
                      </Text>
                    </Checkbox>
                  </div>
                  {checkedSources.includes(ds.key) && (
                    <TextArea
                      rows={2}
                      placeholder={ds.description}
                      value={formData[ds.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [ds.key]: e.target.value }))}
                      style={{ fontSize: 13 }}
                    />
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 步骤3：大纲预览 */}
        <Card title={<span><EyeOutlined style={{ marginRight: 8 }} />第三步：大纲预览</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Steps
            current={-1}
            direction="horizontal"
            size="small"
            items={currentTemplate.sections.map((section, index) => ({
              title: section,
              description: `第${index + 1}章`,
            }))}
          />
        </Card>

        {/* 生成按钮 */}
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerateBP}
          loading={generation.isStreaming}
          block
          size="large"
          style={{
            marginBottom: 16,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: 8,
            height: 48,
            fontSize: 15,
          }}
        >
          {generation.isStreaming ? `正在生成：${generation.currentSection}...` : '生成商业计划书'}
        </Button>

        {/* BP内容展示 */}
        <Card
          title={
            <span>
              <FileTextOutlined style={{ marginRight: 8 }} />BP内容
              {generation.content && (
                <Space style={{ marginLeft: 12 }}>
                  <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
                  <Button size="small" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
                  <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出MD</Button>
                </Space>
              )}
            </span>
          }
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          {generation.error && (
            <Alert message="生成失败" description={generation.error} type="error" showIcon style={{ marginBottom: 12 }} />
          )}
          {generation.isStreaming && !generation.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip={`AI正在撰写「${generation.currentSection}」...`} />
            </div>
          )}
          {generation.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, maxHeight: 600, overflow: 'auto' }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{generation.content}</div>
              {generation.isStreaming && (
                <span style={{ display: 'inline-block', width: 8, height: 16, background: '#10b981', marginLeft: 2, animation: 'blink 1s infinite' }} />
              )}
            </div>
          )}
          {!generation.content && !generation.isStreaming && !generation.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 13 }}>
              选择模板、填写信息后，点击"生成商业计划书"
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BPGenerator;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 在 MakerAI 页面通过 `activeFeature === 'bp'` 渲染
  - 测试模板选择、数据源勾选、大纲预览、AI生成、复制/保存/导出功能

- [ ] 步骤5：下一步
  - 进入任务2：创建路演PPT大纲组件

---

### 任务2：创建路演PPT大纲组件

**文件：** Create `src/components/maker/PPTOutline.tsx`

**目标：** AI生成路演PPT大纲，支持逐页预览和导出。

- [ ] 步骤1：定义PPT大纲数据类型

```typescript
// src/components/maker/PPTOutline.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, InputNumber, message, Space, Tooltip,
} from 'antd';
import {
  PresentationOutlined, ThunderboltOutlined, DownloadOutlined,
  CopyOutlined, SaveOutlined, EyeOutlined, LeftOutlined, RightOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * PPT单页大纲
 */
interface PPTSlide {
  pageNumber: number;
  title: string;           // 页面标题
  keyPoints: string[];     // 要点列表
  speakerNotes: string;    // 演讲备注
  visualSuggestion: string;// 视觉建议
  duration: number;        // 预计时长(秒)
}

/**
 * PPT大纲配置
 */
interface PPTConfig {
  projectName: string;
  purpose: 'fundraising' | 'competition' | 'product_launch' | 'team_intro';
  slideCount: number;
  duration: number;       // 总时长(分钟)
  style: 'formal' | 'energetic' | 'minimal';
}

/**
 * PPT生成状态
 */
interface PPTGenerationState {
  slides: PPTSlide[];
  isStreaming: boolean;
  error: string | null;
  rawContent: string;
}
```

- [ ] 步骤2：实现PPT大纲生成和解析逻辑

```typescript
const purposeOptions = [
  { value: 'fundraising', label: '融资路演', desc: '面向投资人' },
  { value: 'competition', label: '创业大赛', desc: '面向评委' },
  { value: 'product_launch', label: '产品发布', desc: '面向用户' },
  { value: 'team_intro', label: '团队介绍', desc: '面向合作方' },
];

const styleOptions = [
  { value: 'formal', label: '正式商务', desc: '严谨专业' },
  { value: 'energetic', label: '活力创新', desc: '生动有感染力' },
  { value: 'minimal', label: '极简风格', desc: '简洁有力' },
];

const PPTOutline: React.FC = () => {
  const [config, setConfig] = useState<PPTConfig>({
    projectName: '',
    purpose: 'fundraising',
    slideCount: 10,
    duration: 10,
    style: 'formal',
  });
  const [projectDesc, setProjectDesc] = useState('');
  const [generation, setGeneration] = useState<PPTGenerationState>({
    slides: [],
    isStreaming: false,
    error: null,
    rawContent: '',
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const aiContentRef = useRef('');

  /**
   * 解析AI输出的PPT大纲
   */
  const parsePPTOutline = (content: string): PPTSlide[] => {
    const slides: PPTSlide[] = [];
    // 按 ## 分割页面
    const slideBlocks = content.split(/^##\s+/m).filter(block => block.trim());

    slideBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n');
      const title = lines[0].trim();
      const keyPoints: string[] = [];
      let speakerNotes = '';
      let visualSuggestion = '';
      let duration = 60;

      lines.slice(1).forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          keyPoints.push(trimmed.slice(2).trim());
        } else if (trimmed.startsWith('备注：') || trimmed.startsWith('演讲：')) {
          speakerNotes = trimmed.replace(/^(备注：|演讲：)/, '').trim();
        } else if (trimmed.startsWith('视觉：') || trimmed.startsWith('配图：')) {
          visualSuggestion = trimmed.replace(/^(视觉：|配图：)/, '').trim();
        } else if (trimmed.startsWith('时长：')) {
          const match = trimmed.match(/(\d+)/);
          if (match) duration = parseInt(match[1]) * 60;
        }
      });

      slides.push({
        pageNumber: index + 1,
        title,
        keyPoints,
        speakerNotes,
        visualSuggestion,
        duration,
      });
    });

    return slides;
  };

  /**
   * AI生成PPT大纲
   */
  const handleGenerate = async () => {
    if (!config.projectName.trim()) {
      message.warning('请输入项目名称');
      return;
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const purposeInfo = purposeOptions.find(p => p.value === config.purpose)!;
    const styleInfo = styleOptions.find(s => s.value === config.style)!;

    const systemPrompt = `${getSystemPrompt('maker')}
你是专业的路演PPT设计专家。请为以下项目生成${config.slideCount}页的路演PPT大纲。

项目信息：
- 名称：${config.projectName}
- 用途：${purposeInfo.label}（${purposeInfo.desc}）
- 风格：${styleInfo.label}（${styleInfo.desc}）
- 总页数：${config.slideCount}页
- 总时长：${config.duration}分钟
- 项目描述：${projectDesc || '请根据项目名称合理推断'}

请严格按以下格式输出每一页（使用Markdown），每页以 ## 开头：

## 页面标题
- 要点1
- 要点2
- 要点3
备注：演讲时需要注意的内容
视觉：页面配图或视觉元素建议
时长：X秒

路演PPT标准结构参考（根据用途调整）：
1. 封面页（项目名+Logo+Slogan）
2. 问题/痛点
3. 解决方案
4. 产品展示
5. 市场规模
6. 商业模式
7. 竞争优势
8. 获客策略
9. 团队介绍
10. 融资需求/计划
（根据实际页数调整）`;

    setGeneration({ slides: [], isStreaming: true, error: null, rawContent: '' });
    aiContentRef.current = '';
    setCurrentSlideIndex(0);

    try {
      await chatWithZhipuStream(
        [{ role: 'user', content: `请生成「${config.projectName}」的${config.slideCount}页路演PPT大纲` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          const slides = parsePPTOutline(aiContentRef.current);
          setGeneration({
            slides,
            isStreaming: true,
            error: null,
            rawContent: aiContentRef.current,
          });
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 3000, token }
      );
      const finalSlides = parsePPTOutline(aiContentRef.current);
      setGeneration(prev => ({ ...prev, slides: finalSlides, isStreaming: false }));
      message.success(`PPT大纲生成完成，共${finalSlides.length}页`);
    } catch (error) {
      setGeneration({
        slides: [],
        isStreaming: false,
        error: error instanceof Error ? error.message : '生成失败',
        rawContent: '',
      });
      message.error('PPT大纲生成失败');
    }
  };

  /**
   * 导出PPT大纲为文本
   */
  const handleExport = () => {
    if (generation.slides.length === 0) {
      message.warning('暂无可导出的大纲');
      return;
    }
    const content = generation.slides.map(slide => 
      `## 第${slide.pageNumber}页：${slide.title}\n\n${slide.keyPoints.map(p => `- ${p}`).join('\n')}\n\n备注：${slide.speakerNotes}\n视觉：${slide.visualSuggestion}\n时长：${slide.duration}秒\n`
    ).join('\n---\n\n');
    
    const blob = new Blob([`# ${config.projectName} - 路演PPT大纲\n\n${content}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectName}-PPT大纲.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('PPT大纲已导出');
  };

  const handleSave = () => {
    if (generation.slides.length === 0) return;
    saveReport({
      title: `${config.projectName} - 路演PPT大纲`,
      type: 'strategy',
      typeLabel: 'PPT大纲',
      content: generation.rawContent,
    });
    message.success('已保存到报告库');
  };
```

- [ ] 步骤3：实现完整渲染（配置表单 + 逐页预览 + 列表视图）

```typescript
  const currentSlide = generation.slides[currentSlideIndex];

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<PresentationOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>路演PPT大纲</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>AI生成 · 逐页预览 · 一键导出</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 配置区 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col span={8}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>项目名称</Text>
              <Input
                placeholder="输入项目名称"
                value={config.projectName}
                onChange={e => setConfig(prev => ({ ...prev, projectName: e.target.value }))}
              />
            </Col>
            <Col span={6}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>路演用途</Text>
              <Select
                value={config.purpose}
                onChange={v => setConfig(prev => ({ ...prev, purpose: v }))}
                style={{ width: '100%' }}
                options={purposeOptions.map(p => ({ value: p.value, label: `${p.label}（${p.desc}）` }))}
              />
            </Col>
            <Col span={4}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>页数</Text>
              <InputNumber
                value={config.slideCount}
                min={5}
                max={30}
                onChange={v => setConfig(prev => ({ ...prev, slideCount: v || 10 }))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={3}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>时长(分)</Text>
              <InputNumber
                value={config.duration}
                min={3}
                max={60}
                onChange={v => setConfig(prev => ({ ...prev, duration: v || 10 }))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={3}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>风格</Text>
              <Select
                value={config.style}
                onChange={v => setConfig(prev => ({ ...prev, style: v }))}
                style={{ width: '100%' }}
                options={styleOptions.map(s => ({ value: s.value, label: s.label }))}
              />
            </Col>
          </Row>
          <TextArea
            rows={2}
            placeholder="补充项目描述（选填，帮助AI更精准生成）"
            value={projectDesc}
            onChange={e => setProjectDesc(e.target.value)}
            style={{ marginTop: 12 }}
          />
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
            loading={generation.isStreaming}
            block
            size="large"
            style={{ marginTop: 12, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', borderRadius: 8, height: 44 }}
          >
            {generation.isStreaming ? 'AI生成PPT大纲中...' : '生成PPT大纲'}
          </Button>
        </Card>

        {/* PPT大纲展示区 */}
        {generation.error && (
          <Alert message="生成失败" description={generation.error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        {generation.slides.length > 0 ? (
          <>
            {/* 操作栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Space>
                <Text strong>共 {generation.slides.length} 页</Text>
                {generation.isStreaming && <Tag color="processing">生成中...</Tag>}
              </Space>
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(generation.rawContent); message.success('已复制'); }}>复制</Button>
                <Button size="small" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
              </Space>
            </div>

            {/* 逐页预览 */}
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16, minHeight: 300 }}>
              {currentSlide && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Button
                      icon={<LeftOutlined />}
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentSlideIndex === 0}
                    >
                      上一页
                    </Button>
                    <Tag color="purple" style={{ fontSize: 14, padding: '4px 16px' }}>
                      第 {currentSlide.pageNumber} / {generation.slides.length} 页
                    </Tag>
                    <Button
                      onClick={() => setCurrentSlideIndex(prev => Math.min(generation.slides.length - 1, prev + 1))}
                      disabled={currentSlideIndex === generation.slides.length - 1}
                    >
                      下一页 <RightOutlined />
                    </Button>
                  </div>
                  
                  {/* PPT页面模拟 */}
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f110 0%, #8b5cf610 100%)',
                    borderRadius: 12,
                    padding: 24,
                    minHeight: 240,
                    border: '1px solid var(--border-light)',
                  }}>
                    <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>{currentSlide.title}</Title>
                    <div style={{ paddingLeft: 20 }}>
                      {currentSlide.keyPoints.map((point, index) => (
                        <div key={index} style={{ marginBottom: 12, fontSize: 15, display: 'flex', gap: 8 }}>
                          <span style={{ color: '#6366f1', fontWeight: 'bold' }}>{index + 1}.</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 演讲备注和视觉建议 */}
                  <Row gutter={12} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Card size="small" title="演讲备注" style={{ borderRadius: 8 }}>
                        <Text style={{ fontSize: 13 }}>{currentSlide.speakerNotes || '暂无备注'}</Text>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="视觉建议" style={{ borderRadius: 8 }}>
                        <Text style={{ fontSize: 13 }}>{currentSlide.visualSuggestion || '暂无建议'}</Text>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </Card>

            {/* 页面缩略图列表 */}
            <Card title="页面列表" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Row gutter={[8, 8]}>
                {generation.slides.map((slide, index) => (
                  <Col span={4} key={index}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => setCurrentSlideIndex(index)}
                      style={{
                        borderRadius: 8,
                        border: index === currentSlideIndex ? '2px solid #6366f1' : '1px solid var(--border-light)',
                        background: index === currentSlideIndex ? 'rgba(99,102,241,0.05)' : 'transparent',
                        cursor: 'pointer',
                        minHeight: 80,
                      }}
                    >
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>第{slide.pageNumber}页</div>
                      <Text strong style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {slide.title}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </>
        ) : (
          !generation.isStreaming && (
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Empty description="填写项目信息后，点击生成PPT大纲" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          )
        )}

        {generation.isStreaming && generation.slides.length === 0 && (
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="AI正在生成PPT大纲..." />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PPTOutline;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 测试配置表单、AI生成、逐页预览、缩略图切换、导出功能
  - 验证大纲解析逻辑正确（从Markdown提取标题、要点、备注、视觉建议）

- [ ] 步骤5：下一步
  - 进入任务3：创建产品文档生成组件

---

### 任务3：创建产品文档生成组件

**文件：** Create `src/components/maker/ProductDoc.tsx`

**目标：** AI生成产品需求文档(PRD)、用户手册、API文档等产品文档。

- [ ] 步骤1：定义文档类型和配置

```typescript
// src/components/maker/ProductDoc.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, message, Space, Tabs, Tree,
} from 'antd';
import {
  BookOutlined, ThunderboltOutlined, DownloadOutlined, CopyOutlined,
  SaveOutlined, FileTextOutlined, ApiOutlined, ReadOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 文档类型
 */
type DocType = 'prd' | 'user_manual' | 'api_doc' | 'release_note';

/**
 * 文档生成配置
 */
interface DocConfig {
  productName: string;
  docType: DocType;
  version: string;
  description: string;
  audience: string;
}

interface DocGenerationState {
  content: string;
  isStreaming: boolean;
  error: string | null;
}
```

- [ ] 步骤2：实现文档生成逻辑

```typescript
const docTypeOptions: { value: DocType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'prd', label: '产品需求文档(PRD)', icon: <FileTextOutlined />, desc: '功能需求、用户故事、验收标准' },
  { value: 'user_manual', label: '用户使用手册', icon: <ReadOutlined />, desc: '操作指南、FAQ、最佳实践' },
  { value: 'api_doc', label: 'API技术文档', icon: <ApiOutlined />, desc: '接口定义、参数说明、示例代码' },
  { value: 'release_note', label: '版本发布说明', icon: <BookOutlined />, desc: '新功能、修复、已知问题' },
];

const ProductDoc: React.FC = () => {
  const [config, setConfig] = useState<DocConfig>({
    productName: '',
    docType: 'prd',
    version: '1.0.0',
    description: '',
    audience: '终端用户',
  });
  const [generation, setGeneration] = useState<DocGenerationState>({
    content: '',
    isStreaming: false,
    error: null,
  });
  const aiContentRef = useRef('');

  /**
   * 获取文档类型对应的系统提示词
   */
  const getDocSystemPrompt = (docType: DocType, config: DocConfig): string => {
    const basePrompt = `${getSystemPrompt('maker')}
你是专业的技术文档撰写专家。请为产品「${config.productName}」生成「${docTypeOptions.find(d => d.value === docType)?.label}」。

产品信息：
- 名称：${config.productName}
- 版本：${config.version}
- 目标读者：${config.audience}
- 产品描述：${config.description || '请根据产品名称合理推断'}`;

    const typeSpecific: Record<DocType, string> = {
      prd: `\n\n请按以下结构输出（Markdown）：
## 1. 文档概述
（版本信息、修订记录、文档目的）

## 2. 产品背景
（市场需求、用户痛点、产品定位）

## 3. 目标用户
（用户画像、使用场景）

## 4. 功能需求
### 4.1 功能列表
（功能模块、优先级P0/P1/P2）
### 4.2 详细需求
（每个功能的用户故事、验收标准）

## 5. 非功能需求
（性能、安全、兼容性）

## 6. 里程碑计划
（开发排期、发布计划）`,

      user_manual: `\n\n请按以下结构输出（Markdown）：
## 1. 产品简介
（产品概述、核心功能）

## 2. 快速开始
（安装/注册/首次使用指南）

## 3. 功能详解
### 3.1 [功能模块1]
（操作步骤、截图说明）
### 3.2 [功能模块2]

## 4. 常见问题(FAQ)

## 5. 最佳实践

## 6. 联系支持`,

      api_doc: `\n\n请按以下结构输出（Markdown）：
## 1. 概述
（API简介、基础URL、认证方式）

## 2. 通用说明
（请求格式、响应格式、错误码）

## 3. 接口列表
### 3.1 [模块1] 接口
#### POST /api/xxx
- 请求参数
- 响应示例
- 错误码

## 4. 数据模型
（主要数据结构定义）

## 5. 变更记录`,

      release_note: `\n\n请按以下结构输出（Markdown）：
## ${config.productName} v${config.version} 发布说明

发布日期：${new Date().toLocaleDateString('zh-CN')}

### 新功能
- 

### 改进优化
- 

### Bug修复
- 

### 已知问题
- 

### 升级指南
- `,
    };

    return `${basePrompt}${typeSpecific[docType]}`;
  };

  /**
   * AI生成产品文档
   */
  const handleGenerate = async () => {
    if (!config.productName.trim()) {
      message.warning('请输入产品名称');
      return;
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = getDocSystemPrompt(config.docType, config);

    setGeneration({ content: '', isStreaming: true, error: null });
    aiContentRef.current = '';

    try {
      await chatWithZhipuStream(
        [{ role: 'user', content: `请为「${config.productName}」生成${docTypeOptions.find(d => d.value === config.docType)?.label}` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setGeneration(prev => ({ ...prev, content: aiContentRef.current }));
        },
        { system_prompt: systemPrompt, temperature: 0.5, max_tokens: 3000, token }
      );
      setGeneration(prev => ({ ...prev, isStreaming: false }));
      message.success('文档生成完成');
    } catch (error) {
      setGeneration({
        content: '',
        isStreaming: false,
        error: error instanceof Error ? error.message : '生成失败',
      });
      message.error('文档生成失败');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generation.content);
    message.success('已复制到剪贴板');
  };

  const handleSave = () => {
    if (!generation.content) return;
    saveReport({
      title: `${config.productName} - ${docTypeOptions.find(d => d.value === config.docType)?.label}`,
      type: 'strategy',
      typeLabel: '产品文档',
      content: generation.content,
    });
    message.success('已保存到报告库');
  };

  const handleExport = () => {
    if (!generation.content) return;
    const blob = new Blob([generation.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.productName}-${config.docType}-v${config.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('文档已导出');
  };
```

- [ ] 步骤3：实现完整渲染（配置区 + 文档类型选择 + 生成区）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<BookOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>产品文档生成</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>PRD · 用户手册 · API文档 · 发布说明</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 文档类型选择 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>选择文档类型</Text>
          <Row gutter={[12, 12]}>
            {docTypeOptions.map(opt => (
              <Col span={6} key={opt.value}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setConfig(prev => ({ ...prev, docType: opt.value }))}
                  style={{
                    borderRadius: 10,
                    border: config.docType === opt.value ? '2px solid #0ea5e9' : '1px solid var(--border-light)',
                    background: config.docType === opt.value ? 'rgba(14,165,233,0.05)' : 'transparent',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, color: '#0ea5e9', marginBottom: 4 }}>{opt.icon}</div>
                    <Text strong style={{ fontSize: 12 }}>{opt.label}</Text>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{opt.desc}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 配置表单 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col span={8}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>产品名称</Text>
              <Input
                placeholder="输入产品名称"
                value={config.productName}
                onChange={e => setConfig(prev => ({ ...prev, productName: e.target.value }))}
              />
            </Col>
            <Col span={4}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>版本号</Text>
              <Input
                placeholder="1.0.0"
                value={config.version}
                onChange={e => setConfig(prev => ({ ...prev, version: e.target.value }))}
              />
            </Col>
            <Col span={6}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>目标读者</Text>
              <Input
                placeholder="例如：开发团队/终端用户"
                value={config.audience}
                onChange={e => setConfig(prev => ({ ...prev, audience: e.target.value }))}
              />
            </Col>
            <Col span={6}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>产品描述</Text>
              <Input
                placeholder="简要描述产品功能"
                value={config.description}
                onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
              />
            </Col>
          </Row>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
            loading={generation.isStreaming}
            block
            size="large"
            style={{ marginTop: 12, background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', border: 'none', borderRadius: 8, height: 44 }}
          >
            {generation.isStreaming ? 'AI生成文档中...' : '生成产品文档'}
          </Button>
        </Card>

        {/* 文档内容展示 */}
        <Card
          title={
            <span>
              <FileTextOutlined style={{ marginRight: 8 }} />文档内容
              {generation.content && (
                <Space style={{ marginLeft: 12 }}>
                  <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
                  <Button size="small" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
                  <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
                </Space>
              )}
            </span>
          }
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          {generation.error && (
            <Alert message="生成失败" description={generation.error} type="error" showIcon style={{ marginBottom: 12 }} />
          )}
          {generation.isStreaming && !generation.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="AI正在撰写文档..." />
            </div>
          )}
          {generation.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, maxHeight: 600, overflow: 'auto' }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{generation.content}</div>
              {generation.isStreaming && (
                <span style={{ display: 'inline-block', width: 8, height: 16, background: '#0ea5e9', marginLeft: 2, animation: 'blink 1s infinite' }} />
              )}
            </div>
          )}
          {!generation.content && !generation.isStreaming && !generation.error && (
            <Empty description="选择文档类型、填写信息后生成" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProductDoc;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 测试4种文档类型的选择和生成
  - 验证不同文档类型使用不同的系统提示词模板
  - 测试复制、保存、导出功能

- [ ] 步骤5：下一步
  - 进入任务4：创建原型描述组件

---

### 任务4：创建原型描述组件

**文件：** Create `src/components/maker/PrototypeDesc.tsx`

**目标：** AI生成产品原型描述，包含页面结构、交互流程、组件说明。

- [ ] 步骤1：定义原型描述数据类型

```typescript
// src/components/maker/PrototypeDesc.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, message, Space, Collapse, Steps,
} from 'antd';
import {
  LayoutOutlined, ThunderboltOutlined, DownloadOutlined, CopyOutlined,
  SaveOutlined, EyeOutlined, MobileOutlined, DesktopOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 原型页面描述
 */
interface PrototypePage {
  pageName: string;         // 页面名称
  route: string;            // 路由路径
  layout: string;           // 布局描述
  components: string[];     // 组件列表
  interactions: string[];   // 交互说明
  dataFlow: string;         // 数据流向
}

/**
 * 原型配置
 */
interface PrototypeConfig {
  productName: string;
  platform: 'web' | 'mobile' | 'mini_program';
  complexity: 'simple' | 'medium' | 'complex';
  mainFeatures: string;
}
```

- [ ] 步骤2：实现原型描述生成逻辑

```typescript
const platformOptions = [
  { value: 'web', label: 'Web应用', icon: <DesktopOutlined /> },
  { value: 'mobile', label: '移动App', icon: <MobileOutlined /> },
  { value: 'mini_program', label: '小程序', icon: <MobileOutlined /> },
];

const complexityOptions = [
  { value: 'simple', label: '简单（3-5个页面）', desc: 'MVP级别' },
  { value: 'medium', label: '中等（6-10个页面）', desc: '标准产品' },
  { value: 'complex', label: '复杂（10+个页面）', desc: '完整产品' },
];

const PrototypeDesc: React.FC = () => {
  const [config, setConfig] = useState<PrototypeConfig>({
    productName: '',
    platform: 'web',
    complexity: 'medium',
    mainFeatures: '',
  });
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiContentRef = useRef('');

  /**
   * AI生成原型描述
   */
  const handleGenerate = async () => {
    if (!config.productName.trim()) {
      message.warning('请输入产品名称');
      return;
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const platformLabel = platformOptions.find(p => p.value === config.platform)?.label || 'Web应用';
    const complexityLabel = complexityOptions.find(c => c.value === config.complexity)?.label || '';

    const systemPrompt = `${getSystemPrompt('maker')}
你是专业的产品原型设计师。请为产品「${config.productName}」生成详细的原型描述文档。

产品信息：
- 平台：${platformLabel}
- 复杂度：${complexityLabel}
- 主要功能：${config.mainFeatures || '请根据产品名称合理推断'}

请按以下结构输出（Markdown）：

## 1. 原型概述
（产品整体架构、页面数量、设计风格）

## 2. 页面结构总览
（页面清单、路由树、页面跳转关系）

## 3. 详细页面设计

### 3.1 首页（/）
- **布局**：（页面布局描述，如顶部导航+侧边栏+内容区）
- **核心组件**：（页面包含的主要组件）
- **交互说明**：（用户操作和反馈）
- **数据流向**：（数据获取和展示逻辑）

### 3.2 [第二个页面]（/xxx）
- **布局**：
- **核心组件**：
- **交互说明**：
- **数据流向**：

（根据复杂度生成对应数量的页面）

## 4. 全局组件
（导航栏、侧边栏、弹窗等通用组件的描述）

## 5. 交互流程
（关键用户流程的步骤描述）

## 6. 技术建议
（前端技术栈、UI框架推荐）`;

    setContent('');
    setError(null);
    setIsStreaming(true);
    aiContentRef.current = '';

    try {
      await chatWithZhipuStream(
        [{ role: 'user', content: `请为「${config.productName}」生成${platformLabel}原型描述` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setContent(aiContentRef.current);
        },
        { system_prompt: systemPrompt, temperature: 0.6, max_tokens: 3000, token }
      );
      setIsStreaming(false);
      message.success('原型描述生成完成');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      setIsStreaming(false);
      message.error('原型描述生成失败');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    message.success('已复制');
  };

  const handleSave = () => {
    if (!content) return;
    saveReport({
      title: `${config.productName} - 原型描述`,
      type: 'strategy',
      typeLabel: '原型描述',
      content,
    });
    message.success('已保存');
  };

  const handleExport = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.productName}-原型描述.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已导出');
  };
```

- [ ] 步骤3：实现完整渲染

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<LayoutOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>原型描述生成</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>页面结构 · 交互流程 · 组件说明</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 配置区 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col span={8}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>产品名称</Text>
              <Input
                placeholder="输入产品名称"
                value={config.productName}
                onChange={e => setConfig(prev => ({ ...prev, productName: e.target.value }))}
              />
            </Col>
            <Col span={8}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>目标平台</Text>
              <Select
                value={config.platform}
                onChange={v => setConfig(prev => ({ ...prev, platform: v }))}
                style={{ width: '100%' }}
                options={platformOptions.map(p => ({ value: p.value, label: p.label }))}
              />
            </Col>
            <Col span={8}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>复杂度</Text>
              <Select
                value={config.complexity}
                onChange={v => setConfig(prev => ({ ...prev, complexity: v }))}
                style={{ width: '100%' }}
                options={complexityOptions.map(c => ({ value: c.value, label: c.label }))}
              />
            </Col>
          </Row>
          <TextArea
            rows={2}
            placeholder="描述产品的主要功能（例如：用户注册登录、内容发布、评论互动、个人中心）"
            value={config.mainFeatures}
            onChange={e => setConfig(prev => ({ ...prev, mainFeatures: e.target.value }))}
            style={{ marginTop: 12 }}
          />
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
            loading={isStreaming}
            block
            size="large"
            style={{ marginTop: 12, background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', border: 'none', borderRadius: 8, height: 44 }}
          >
            {isStreaming ? 'AI生成原型描述中...' : '生成原型描述'}
          </Button>
        </Card>

        {/* 内容展示 */}
        <Card
          title={
            <span>
              <EyeOutlined style={{ marginRight: 8 }} />原型描述
              {content && (
                <Space style={{ marginLeft: 12 }}>
                  <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
                  <Button size="small" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
                  <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
                </Space>
              )}
            </span>
          }
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          {error && <Alert message="生成失败" description={error} type="error" showIcon style={{ marginBottom: 12 }} />}
          {isStreaming && !content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="AI正在设计原型..." />
            </div>
          )}
          {content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, maxHeight: 600, overflow: 'auto' }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
              {isStreaming && (
                <span style={{ display: 'inline-block', width: 8, height: 16, background: '#8b5cf6', marginLeft: 2, animation: 'blink 1s infinite' }} />
              )}
            </div>
          )}
          {!content && !isStreaming && !error && (
            <Empty description="填写产品信息后生成原型描述" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrototypeDesc;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 测试平台选择（Web/App/小程序）、复杂度选择
  - 验证AI生成的原型描述包含页面结构、组件说明、交互流程
  - 测试复制、保存、导出功能

- [ ] 步骤5：下一步
  - 进入任务5：更新 MakerAI.tsx 整合所有面板

---

### 任务5：更新 MakerAI.tsx 整合所有子面板

**文件：** Modify `src/pages/MakerAI.tsx`

**目标：** 将4个面板组件整合到 MakerAI 页面，更新 App.tsx 子菜单。保留现有九大创业方向技能库功能。

- [ ] 步骤1：更新 `src/App.tsx` 中的 makerSubs 菜单定义

```typescript
// src/App.tsx 中修改 makerSubs

const makerSubs: SubMenuItem[] = [
  { key: 'bp', label: 'BP生成器' },
  { key: 'ppt', label: '路演PPT大纲' },
  { key: 'product_doc', label: '产品文档' },
  { key: 'prototype', label: '原型描述' },
];
```

- [ ] 步骤2：更新 `src/pages/MakerAI.tsx`，新增4个面板的引入和渲染分支

```typescript
// src/pages/MakerAI.tsx 关键修改部分

// 新增引入（在文件顶部 import 区域添加）
import BPGenerator from '../components/maker/BPGenerator';
import PPTOutline from '../components/maker/PPTOutline';
import ProductDoc from '../components/maker/ProductDoc';
import PrototypeDesc from '../components/maker/PrototypeDesc';

// 修改 renderFeaturePanel 函数中的 switch 分支
const renderFeaturePanel = () => {
  if (!activeFeature) return undefined;

  const panelContent = (() => {
    switch (activeFeature) {
      case 'bp':
        return <BPGenerator />;
      case 'ppt':
        return <PPTOutline />;
      case 'product_doc':
        return <ProductDoc />;
      case 'prototype':
        return <PrototypeDesc />;
      case 'skills':
        return renderSkillsPanel();  // 保留现有技能库功能
      default:
        return (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            该功能正在开发中，敬请期待...
          </div>
        );
    }
  })();

  return (
    <div style={{ position: 'relative' }}>
      <Button
        type="text"
        icon={<CloseOutlined />}
        size="small"
        onClick={() => setActiveFeature(null)}
        style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
      />
      {panelContent}
    </div>
  );
};
```

- [ ] 步骤3：验证方法
  - 启动开发服务器 `npm run dev`
  - 登录后进入工匠AI页面
  - 依次点击侧边栏子菜单：BP生成器、路演PPT大纲、产品文档、原型描述
  - 确认每个面板都能正确渲染
  - 测试各面板的AI生成和导出功能
  - 验证原有的"创业技能库"功能仍然正常

- [ ] 步骤4：最终检查清单
  - [ ] `BPGenerator.tsx` — 模板选择、数据源勾选、大纲预览、AI流式生成、导出
  - [ ] `PPTOutline.tsx` — 配置表单、AI生成、逐页预览、缩略图切换、导出
  - [ ] `ProductDoc.tsx` — 4种文档类型、AI生成、复制/保存/导出
  - [ ] `PrototypeDesc.tsx` — 平台/复杂度选择、AI生成、导出
  - [ ] `MakerAI.tsx` — 四个新面板 + 现有技能库切换正常
  - [ ] `App.tsx` — 子菜单显示正确

- [ ] 步骤5：下一步
  - 工匠AI模块完成，可进入 Plan-07 管家AI模块

---

## 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/components/maker/BPGenerator.tsx` | 新建 | BP生成器（模板+数据源+大纲+AI生成） |
| `src/components/maker/PPTOutline.tsx` | 新建 | 路演PPT大纲（逐页预览+导出） |
| `src/components/maker/ProductDoc.tsx` | 新建 | 产品文档生成（PRD/手册/API/发布说明） |
| `src/components/maker/PrototypeDesc.tsx` | 新建 | 原型描述生成 |
| `src/pages/MakerAI.tsx` | 修改 | 整合4个新面板 + 保留现有技能库 |
| `src/App.tsx` | 修改 | 更新 makerSubs 菜单 |

## 导出功能说明

所有4个组件均提供统一的导出能力：

| 功能 | 实现方式 | 说明 |
|------|---------|------|
| 复制 | `navigator.clipboard.writeText()` | 复制到系统剪贴板 |
| 保存 | `saveReport()` from `reportStorage.ts` | 保存到localStorage报告库 |
| 导出 | `Blob` + `URL.createObjectURL()` | 导出为 `.md` Markdown文件 |

## 注意事项

1. **PPT大纲解析**：从AI流式输出中按 `## ` 分割页面，提取标题、要点、备注、视觉建议
2. **BP模板**：4种模板（标准/精益/路演/大赛），每种有不同章节结构和字数预期
3. **文档类型**：4种文档类型使用不同的系统提示词模板，确保输出格式符合各类文档规范
4. **AI温度参数**：PRD和API文档使用较低温度(0.5)保证准确性，BP和PPT使用较高温度(0.7)保证创造性
5. **保留现有功能**：MakerAI 页面现有的"九大创业方向技能库"功能需保留，新增4个面板作为子菜单补充
