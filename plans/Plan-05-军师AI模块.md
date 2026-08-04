# 军师AI模块 实施计划

> **目标：** 实现军师AI的商业策略、商业模式画布、风险评估、融资规划四大核心功能，为大学生创业者提供战略级决策支持。
>
> **依赖：** Plan-01（项目基础架构）、Plan-02（API真实化）、Plan-03（AI模型集成）
>
> **技术栈：** React 19 + TypeScript + Ant Design 6 + Zustand + 智谱GLM流式接口 + localStorage持久化

---

## 模块概述

军师AI（SageAI）定位为"运营策略顾问"，为大学生创业者提供从战略到融资的全链路规划。本计划在现有 `src/components/sage/` 目录基础上，新增4个核心面板并整合到 `SageAI.tsx` 页面中。

### 现有代码基础

| 文件路径 | 说明 |
|---------|------|
| `src/pages/SageAI.tsx` | 军师AI主页面，已接入 ChatLayout |
| `src/components/sage/EntrepreneurshipPlanning.tsx` | 现有创业规划面板 |
| `src/components/sage/StrategyPlanningPanel.tsx` | 现有策略规划面板 |
| `src/components/sage/BenchmarkPanel.tsx` | 现有行业对标面板 |
| `src/components/sage/GrowthStrategyPanel.tsx` | 现有增长策略面板 |
| `src/components/sage/MarketingPlanPanel.tsx` | 现有营销方案面板 |
| `src/components/sage/DataAnalysisPanel.tsx` | 现有数据分析面板 |
| `src/components/sage/visualizations/` | 可视化组件（FlowChart, FunnelChart, MindMap） |
| `src/services/aiService.ts` | AI服务层，已有 `chatWithZhipuStream` |
| `src/utils/reportStorage.ts` | 报告本地存储工具 |

### 子菜单规划（需更新 App.tsx）

```typescript
const sageSubs: SubMenuItem[] = [
  { key: 'strategy', label: '商业策略' },       // 任务1
  { key: 'canvas', label: '商业模式画布' },     // 任务2
  { key: 'risk', label: '风险评估' },           // 任务3
  { key: 'financing', label: '融资规划' },      // 任务4
];
```

---

### 任务1：创建策略对话面板

**文件：** Create `src/components/sage/StrategyPanel.tsx`

**目标：** 提供结构化的策略对话界面，AI根据用户输入的项目信息生成商业策略建议。

- [ ] 步骤1：定义组件Props和策略数据类型

```typescript
// src/components/sage/StrategyPanel.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Form, Tabs, Space, message, Tooltip, Progress,
} from 'antd';
import {
  BulbOutlined, ThunderboltOutlined, RocketOutlined, AimOutlined,
  CheckCircleOutlined, TargetOutlined, CompassOutlined, SaveOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 策略类型
 */
type StrategyType = 'market_entry' | 'growth' | 'competitive' | 'pivot';

/**
 * 策略对话消息
 */
interface StrategyMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * 项目基本信息
 */
interface ProjectContext {
  projectName: string;
  industry: string;
  stage: string;
  description: string;
}

interface StrategyPanelProps {
  /** 初始项目上下文 */
  initialContext?: Partial<ProjectContext>;
}
```

- [ ] 步骤2：实现策略生成核心逻辑

```typescript
const strategyTypeOptions = [
  { value: 'market_entry', label: '市场进入策略', icon: '🚀', desc: '如何进入市场、获取首批用户' },
  { value: 'growth', label: '增长策略', icon: '📈', desc: '用户增长、收入增长的方法' },
  { value: 'competitive', label: '竞争策略', icon: '⚔️', desc: '应对竞争的差异化策略' },
  { value: 'pivot', label: '转型策略', icon: '🔄', desc: '业务转型方向和路径' },
];

const StrategyPanel: React.FC<StrategyPanelProps> = ({ initialContext }) => {
  const [form] = Form.useForm();
  const [strategyType, setStrategyType] = useState<StrategyType>('market_entry');
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    projectName: initialContext?.projectName || '',
    industry: initialContext?.industry || 'tech',
    stage: initialContext?.stage || 'idea',
    description: initialContext?.description || '',
  });
  const [messages, setMessages] = useState<StrategyMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const streamRef = useRef('');

  /**
   * 调用AI生成策略建议
   */
  const handleGenerateStrategy = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const typeInfo = strategyTypeOptions.find(t => t.value === strategyType)!;
    const industryLabels: Record<string, string> = {
      tech: '科技', finance: '金融', healthcare: '医疗', education: '教育',
      retail: '零售', manufacturing: '制造',
    };
    const stageLabels: Record<string, string> = {
      idea: '创意阶段', mvp: 'MVP阶段', launch: '启动阶段', growth: '增长阶段',
    };

    const systemPrompt = `${getSystemPrompt('sage')}
你是资深的商业策略顾问。请为以下项目生成专业的${typeInfo.label}。

项目信息：
- 名称：${projectContext.projectName || '未命名项目'}
- 行业：${industryLabels[projectContext.industry] || projectContext.industry}
- 阶段：${stageLabels[projectContext.stage] || projectContext.stage}
- 描述：${projectContext.description || '暂无描述'}

策略类型：${typeInfo.label}（${typeInfo.desc}）

请按以下格式输出（Markdown）：
## 策略概述
（核心策略思路，一段话概括）

## 当前现状分析
（基于项目阶段和行业的特点分析）

## 策略框架
### 短期目标（1-3个月）
### 中期目标（3-6个月）
### 长期目标（6-12个月）

## 关键举措
（具体的行动步骤，每步包含：做什么、怎么做、预期效果）

## 资源需求
（人力、资金、技术等资源需求）

## 风险与对策
（主要风险及应对方案）`;

    const userMessage: StrategyMessage = {
      role: 'user',
      content: `请为「${projectContext.projectName || '我的项目'}」生成${typeInfo.label}`,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setStreamContent('');
    streamRef.current = '';

    try {
      await chatWithZhipuStream(
        [{ role: 'user', content: userMessage.content }],
        (chunk: string) => {
          streamRef.current += chunk;
          setStreamContent(streamRef.current);
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 2500, token }
      );

      const assistantMessage: StrategyMessage = {
        role: 'assistant',
        content: streamRef.current,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setStreamContent('');
    } catch (error) {
      message.error('策略生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 保存策略报告
   */
  const handleSaveReport = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistant) {
      message.warning('暂无可保存的策略报告');
      return;
    }
    saveReport({
      title: `${projectContext.projectName || '项目'} - 策略报告`,
      type: 'strategy',
      typeLabel: '商业策略',
      content: lastAssistant.content,
    });
    message.success('策略报告已保存');
  };
```

- [ ] 步骤3：实现完整渲染（项目信息表单 + 策略类型选择 + 对话区）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<BulbOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>商业策略</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>AI驱动的商业策略规划</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 项目信息表单 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="项目名称" name="projectName">
                  <Input
                    placeholder="输入项目名称"
                    value={projectContext.projectName}
                    onChange={e => setProjectContext(prev => ({ ...prev, projectName: e.target.value }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="行业" name="industry">
                  <Select
                    value={projectContext.industry}
                    onChange={val => setProjectContext(prev => ({ ...prev, industry: val }))}
                    options={[
                      { value: 'tech', label: '科技' },
                      { value: 'finance', label: '金融' },
                      { value: 'healthcare', label: '医疗' },
                      { value: 'education', label: '教育' },
                      { value: 'retail', label: '零售' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="阶段" name="stage">
                  <Select
                    value={projectContext.stage}
                    onChange={val => setProjectContext(prev => ({ ...prev, stage: val }))}
                    options={[
                      { value: 'idea', label: '创意阶段' },
                      { value: 'mvp', label: 'MVP阶段' },
                      { value: 'launch', label: '启动阶段' },
                      { value: 'growth', label: '增长阶段' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="项目描述" name="description">
              <TextArea
                rows={2}
                placeholder="简要描述你的项目（做什么、为谁做、怎么赚钱）"
                value={projectContext.description}
                onChange={e => setProjectContext(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Item>
          </Form>
        </Card>

        {/* 策略类型选择 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>选择策略类型</Text>
          <Row gutter={12}>
            {strategyTypeOptions.map(opt => (
              <Col span={6} key={opt.value}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setStrategyType(opt.value as StrategyType)}
                  style={{
                    borderRadius: 10,
                    border: strategyType === opt.value ? '2px solid #f59e0b' : '1px solid var(--border-light)',
                    background: strategyType === opt.value ? 'rgba(245,158,11,0.05)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{opt.icon}</div>
                    <Text strong style={{ fontSize: 13 }}>{opt.label}</Text>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{opt.desc}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateStrategy}
            loading={isGenerating}
            block
            size="large"
            style={{
              marginTop: 16,
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
              border: 'none',
              borderRadius: 8,
              height: 44,
            }}
          >
            {isGenerating ? 'AI生成策略中...' : '生成商业策略'}
          </Button>
        </Card>

        {/* 策略对话区 */}
        <Card
          title={
            <span>
              <CompassOutlined style={{ marginRight: 8 }} />策略输出
              {messages.length > 0 && (
                <Button
                  type="text"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={handleSaveReport}
                  style={{ marginLeft: 12 }}
                >
                  保存报告
                </Button>
              )}
            </span>
          }
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          {messages.length === 0 && !isGenerating && (
            <Empty description="填写项目信息后，点击生成策略" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar size="small" style={{ background: msg.role === 'user' ? '#1890ff' : '#f59e0b' }}>
                  {msg.role === 'user' ? '我' : 'AI'}
                </Avatar>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {msg.role === 'user' ? '我的请求' : '军师AI策略'}
                </Text>
              </div>
              <div
                className="ai-analysis-content"
                style={{
                  marginLeft: 32,
                  padding: 12,
                  background: msg.role === 'user' ? 'rgba(24,144,255,0.05)' : 'rgba(245,158,11,0.05)',
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div style={{ marginLeft: 32, padding: 12, background: 'rgba(245,158,11,0.05)', borderRadius: 8 }}>
              {streamContent ? (
                <div className="ai-analysis-content" style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {streamContent}
                  <span style={{ display: 'inline-block', width: 8, height: 16, background: '#f59e0b', marginLeft: 2, animation: 'blink 1s infinite' }} />
                </div>
              ) : (
                <Spin tip="AI正在生成策略..." />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StrategyPanel;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 在 SageAI 页面通过 `activeFeature === 'strategy'` 渲染
  - 测试项目信息填写、策略类型切换、AI流式生成、保存报告功能

- [ ] 步骤5：下一步
  - 进入任务2：创建商业模式画布组件

---

### 任务2：创建商业模式九宫格画布组件（可编辑）

**文件：** Create `src/components/sage/BusinessCanvas.tsx`

**目标：** 实现可编辑的商业模式九宫格画布，支持AI自动填充和本地保存。

- [ ] 步骤1：定义九宫格数据类型

```typescript
// src/components/sage/BusinessCanvas.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Card, Input, Button, Tag, Typography, Spin, Alert, Modal, message,
  Row, Col, Avatar, Tooltip, Empty, Divider, Space,
} from 'antd';
import {
  EditOutlined, ThunderboltOutlined, SaveOutlined, ReloadOutlined,
  AppstoreOutlined, UserOutlined, SyncOutlined, DollarOutlined,
  SettingOutlined, FlagOutlined, TeamOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 九宫格区块定义
 */
interface CanvasBlock {
  key: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  placeholder: string;
  content: string;
}

/**
 * 画布数据
 */
interface CanvasData {
  projectName: string;
  blocks: Record<string, string>;
  updatedAt: string;
}

const CANVAS_STORAGE_KEY = 'sage_business_canvas';
```

- [ ] 步骤2：定义九宫格区块配置

```typescript
// 九宫格区块配置（顺序对应商业模式画布标准布局）
const canvasBlockConfig: Omit<CanvasBlock, 'content'>[] = [
  {
    key: 'key_partners',
    title: '重要伙伴',
    icon: <TeamOutlined />,
    color: '#3B82F6',
    description: '关键合作伙伴和供应商',
    placeholder: '谁是你的关键合作伙伴？\n供应商？\n合作伙伴提供什么资源？',
  },
  {
    key: 'key_activities',
    title: '关键业务',
    icon: <SyncOutlined />,
    color: '#10B981',
    description: '核心业务活动',
    placeholder: '你的关键业务活动是什么？\n生产？\n解决问题？\n平台运营？',
  },
  {
    key: 'key_resources',
    title: '核心资源',
    icon: <AppstoreOutlined />,
    color: '#F59E0B',
    description: '核心资源和资产',
    placeholder: '你的核心资源是什么？\n物理资源？\n知识产权？\n人力资源？\n资金？',
  },
  {
    key: 'value_propositions',
    title: '价值主张',
    icon: <FlagOutlined />,
    color: '#EF4444',
    description: '为客户提供什么价值',
    placeholder: '你为客户解决什么问题？\n满足什么需求？\n提供什么好处？\n核心价值是什么？',
  },
  {
    key: 'customer_relationships',
    title: '客户关系',
    icon: <UserOutlined />,
    color: '#8B5CF6',
    description: '与客户建立的关系类型',
    placeholder: '你与客户建立什么关系？\n个人服务？\n自助服务？\n社群？\n自动化服务？',
  },
  {
    key: 'channels',
    title: '渠道通路',
    icon: <SyncOutlined />,
    color: '#06B6D4',
    description: '如何触达客户',
    placeholder: '通过什么渠道触达客户？\n线上？线下？\n直销？分销？\n社交媒体？',
  },
  {
    key: 'customer_segments',
    title: '客户细分',
    icon: <TeamOutlined />,
    color: '#EC4899',
    description: '目标客户群体',
    placeholder: '你的目标客户是谁？\n大众市场？\n细分市场？\n多边市场？',
  },
  {
    key: 'cost_structure',
    title: '成本结构',
    icon: <DollarOutlined />,
    color: '#6B7280',
    description: '主要成本项',
    placeholder: '你的主要成本是什么？\n固定成本？\n可变成本？\n人力成本？\n技术成本？',
  },
  {
    key: 'revenue_streams',
    title: '收入来源',
    icon: <DollarOutlined />,
    color: '#22C55E',
    description: '盈利模式',
    placeholder: '你的收入来源是什么？\n一次性销售？\n订阅费？\n使用费？\n广告费？\n佣金？',
  },
];
```

- [ ] 步骤3：实现画布组件核心逻辑（含AI填充和本地存储）

```typescript
const BusinessCanvas: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [blocks, setBlocks] = useState<Record<string, string>>(
    () => {
      // 从localStorage加载
      try {
        const saved = localStorage.getItem(CANVAS_STORAGE_KEY);
        if (saved) {
          const data: CanvasData = JSON.parse(saved);
          setProjectName(data.projectName);
          return data.blocks;
        }
      } catch {}
      return {};
    }
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isAIFilling, setIsAIFilling] = useState(false);
  const [aiStreamContent, setAiStreamContent] = useState('');

  // 自动保存到localStorage
  useEffect(() => {
    const data: CanvasData = {
      projectName,
      blocks,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(data));
  }, [projectName, blocks]);

  // 编辑区块
  const handleEdit = (key: string) => {
    setEditingKey(key);
    setEditContent(blocks[key] || '');
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingKey) {
      setBlocks(prev => ({ ...prev, [editingKey]: editContent }));
      setEditingKey(null);
      message.success('已保存');
    }
  };

  /**
   * AI自动填充画布
   */
  const handleAIFill = async () => {
    if (!projectName.trim()) {
      message.warning('请先输入项目名称');
      return;
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const existingContent = Object.entries(blocks)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => {
        const config = canvasBlockConfig.find(c => c.key === k);
        return `- ${config?.title}：${v}`;
      })
      .join('\n');

    const systemPrompt = `${getSystemPrompt('sage')}
你是商业模式设计专家。请为项目「${projectName}」设计完整的商业模式画布。

${existingContent ? `已有内容：\n${existingContent}\n\n请在此基础上完善和补充。` : '请从零设计完整的商业模式画布。'}

请严格按照以下JSON格式输出，不要输出其他内容：
{
  "key_partners": "重要伙伴内容",
  "key_activities": "关键业务内容",
  "key_resources": "核心资源内容",
  "value_propositions": "价值主张内容",
  "customer_relationships": "客户关系内容",
  "channels": "渠道通路内容",
  "customer_segments": "客户细分内容",
  "cost_structure": "成本结构内容",
  "revenue_streams": "收入来源内容"
}

每个字段的内容用简洁的要点描述，2-4条。`;

    setIsAIFilling(true);
    setAiStreamContent('');

    try {
      let fullContent = '';
      await chatWithZhipuStream(
        [{ role: 'user', content: `请为「${projectName}」设计商业模式画布` }],
        (chunk: string) => {
          fullContent += chunk;
          setAiStreamContent(fullContent);
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 2000, token }
      );

      // 尝试解析JSON
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setBlocks(prev => ({ ...prev, ...parsed }));
        message.success('AI已填充商业模式画布');
      } else {
        message.warning('AI输出格式异常，请重试');
      }
    } catch (error) {
      message.error('AI填充失败，请稍后重试');
    } finally {
      setIsAIFilling(false);
      setAiStreamContent('');
    }
  };

  // 清空画布
  const handleClear = () => {
    Modal.confirm({
      title: '确认清空画布？',
      content: '所有已填写的内容将被清除，此操作不可恢复',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setBlocks({});
        message.success('画布已清空');
      },
    });
  };

  // 导出画布
  const handleExport = () => {
    const content = `# ${projectName || '项目'} - 商业模式画布

> 生成时间：${new Date().toLocaleString('zh-CN')}

${canvasBlockConfig.map(config => {
    const content = blocks[config.key] || '（未填写）';
    return `## ${config.title}\n${content}\n`;
  }).join('\n---\n\n')}`;

    saveReport({
      title: `${projectName || '项目'} - 商业模式画布`,
      type: 'strategy',
      typeLabel: '商业模式画布',
      content,
    });
    message.success('画布已导出保存');
  };
```

- [ ] 步骤4：实现九宫格布局渲染

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<AppstoreOutlined />} />
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>商业模式画布</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>九宫格可视化 · 可编辑 · AI填充</div>
            </div>
          </div>
        </div>
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="输入项目名称"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff' }}
            />
          </Col>
          <Col>
            <Button icon={<ThunderboltOutlined />} onClick={handleAIFill} loading={isAIFilling}
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
              AI填充
            </Button>
          </Col>
          <Col>
            <Button icon={<SaveOutlined />} onClick={handleExport}
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
              导出
            </Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleClear}
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
              清空
            </Button>
          </Col>
        </Row>
      </div>

      {/* AI填充进度 */}
      {isAIFilling && (
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.05)' }}>
          <Spin tip="AI正在生成商业模式画布..." />
          {aiStreamContent && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', maxHeight: 100, overflow: 'auto' }}>
              {aiStreamContent}
            </div>
          )}
        </div>
      )}

      {/* 九宫格画布 */}
      <div style={{ padding: 16 }}>
        {/* 第一行：伙伴 | 业务+资源 | 价值主张 | 客户关系+渠道 | 客户细分 */}
        <Row gutter={[8, 8]}>
          {/* 重要伙伴 */}
          <Col span={4}>
            <CanvasBlockCard
              config={canvasBlockConfig[0]}
              content={blocks['key_partners'] || ''}
              onEdit={() => handleEdit('key_partners')}
            />
          </Col>
          {/* 关键业务 + 核心资源（上下排列） */}
          <Col span={5}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
              <CanvasBlockCard
                config={canvasBlockConfig[1]}
                content={blocks['key_activities'] || ''}
                onEdit={() => handleEdit('key_activities')}
                compact
              />
              <CanvasBlockCard
                config={canvasBlockConfig[2]}
                content={blocks['key_resources'] || ''}
                onEdit={() => handleEdit('key_resources')}
                compact
              />
            </div>
          </Col>
          {/* 价值主张（居中，占满高度） */}
          <Col span={6}>
            <CanvasBlockCard
              config={canvasBlockConfig[3]}
              content={blocks['value_propositions'] || ''}
              onEdit={() => handleEdit('value_propositions')}
              highlight
            />
          </Col>
          {/* 客户关系 + 渠道通路（上下排列） */}
          <Col span={5}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
              <CanvasBlockCard
                config={canvasBlockConfig[4]}
                content={blocks['customer_relationships'] || ''}
                onEdit={() => handleEdit('customer_relationships')}
                compact
              />
              <CanvasBlockCard
                config={canvasBlockConfig[5]}
                content={blocks['channels'] || ''}
                onEdit={() => handleEdit('channels')}
                compact
              />
            </div>
          </Col>
          {/* 客户细分 */}
          <Col span={4}>
            <CanvasBlockCard
              config={canvasBlockConfig[6]}
              content={blocks['customer_segments'] || ''}
              onEdit={() => handleEdit('customer_segments')}
            />
          </Col>
        </Row>
        {/* 第二行：成本结构 | 收入来源 */}
        <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
          <Col span={12}>
            <CanvasBlockCard
              config={canvasBlockConfig[7]}
              content={blocks['cost_structure'] || ''}
              onEdit={() => handleEdit('cost_structure')}
            />
          </Col>
          <Col span={12}>
            <CanvasBlockCard
              config={canvasBlockConfig[8]}
              content={blocks['revenue_streams'] || ''}
              onEdit={() => handleEdit('revenue_streams')}
            />
          </Col>
        </Row>
      </div>

      {/* 编辑弹窗 */}
      <Modal
        title={editingKey ? canvasBlockConfig.find(c => c.key === editingKey)?.title : ''}
        open={!!editingKey}
        onOk={handleSaveEdit}
        onCancel={() => setEditingKey(null)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        {editingKey && (
          <>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              {canvasBlockConfig.find(c => c.key === editingKey)?.description}
            </Paragraph>
            <TextArea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={8}
              placeholder={canvasBlockConfig.find(c => c.key === editingKey)?.placeholder}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

/**
 * 画布区块卡片子组件
 */
const CanvasBlockCard: React.FC<{
  config: Omit<CanvasBlock, 'content'>;
  content: string;
  onEdit: () => void;
  compact?: boolean;
  highlight?: boolean;
}> = ({ config, content, onEdit, compact, highlight }) => {
  return (
    <Card
      size="small"
      style={{
        borderRadius: 10,
        border: highlight ? `2px solid ${config.color}` : '1px solid var(--border-light)',
        background: highlight ? `${config.color}08` : 'var(--bg-glass)',
        height: '100%',
        minHeight: compact ? 120 : 200,
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{ body: { padding: 12, flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={4}>
          <span style={{ color: config.color, fontSize: 16 }}>{config.icon}</span>
          <Text strong style={{ fontSize: 12, color: config.color }}>{config.title}</Text>
        </Space>
        <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit} />
      </div>
      <div style={{ flex: 1, fontSize: 12, lineHeight: 1.6, color: content ? 'var(--text-primary)' : 'var(--text-muted)', overflow: 'auto' }}>
        {content ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
        ) : (
          <div style={{ fontStyle: 'italic' }}>{config.placeholder.split('\n')[0]}</div>
        )}
      </div>
    </Card>
  );
};

export default BusinessCanvas;
```

- [ ] 步骤5：验证方法
  - 确认文件无编译错误
  - 测试九宫格布局正确显示
  - 测试点击编辑、保存、AI填充、清空、导出功能
  - 验证localStorage自动保存生效（刷新页面后数据保留）

- [ ] 步骤6：下一步
  - 进入任务3：创建风险评估矩阵组件

---

### 任务3：创建风险评估矩阵组件

**文件：** Create `src/components/sage/RiskMatrix.tsx`

**目标：** 可视化展示风险矩阵（概率×影响），AI生成风险应对策略。

- [ ] 步骤1：定义风险数据类型和矩阵配置

```typescript
// src/components/sage/RiskMatrix.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Modal, Form, Table, Tooltip, message, Badge,
} from 'antd';
import {
  WarningOutlined, ThunderboltOutlined, PlusOutlined, DeleteOutlined,
  ExclamationCircleOutlined, SafetyOutlined, AimOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Paragraph, Title } = Typography;

/**
 * 风险项
 */
interface RiskItem {
  id: string;
  name: string;              // 风险名称
  category: string;          // 风险类别
  probability: number;       // 发生概率(1-5)
  impact: number;            // 影响程度(1-5)
  description: string;       // 风险描述
  mitigation: string;        // 应对措施
  status: 'identified' | 'monitoring' | 'mitigated';
}

/**
 * 风险等级计算
 */
function getRiskLevel(probability: number, impact: number): {
  level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  score: number;
} {
  const score = probability * impact;
  if (score >= 16) return { level: 'critical', color: '#ff4d4f', score };
  if (score >= 9) return { level: 'high', color: '#fa8c16', score };
  if (score >= 4) return { level: 'medium', color: '#faad14', score };
  return { level: 'low', color: '#52c41a', score };
}

const riskCategories = [
  { value: 'market', label: '市场风险', color: '#1890ff' },
  { value: 'tech', label: '技术风险', color: '#722ed1' },
  { value: 'financial', label: '财务风险', color: '#faad14' },
  { value: 'team', label: '团队风险', color: '#13c2c2' },
  { value: 'legal', label: '法律风险', color: '#ff4d4f' },
  { value: 'operational', label: '运营风险', color: '#52c41a' },
];

const levelLabels: Record<string, string> = {
  low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险',
};
```

- [ ] 步骤2：实现风险矩阵SVG绘制

```typescript
/**
 * 风险矩阵可视化组件
 */
const RiskMatrixGrid: React.FC<{ risks: RiskItem[]; onCellClick?: (p: number, i: number) => void }> = ({
  risks,
  onCellClick,
}) => {
  const cellSize = 56;
  const labelSize = 40;
  const gridSize = cellSize * 5;

  // 5x5矩阵单元格颜色
  const getCellColor = (prob: number, impact: number) => {
    const { level } = getRiskLevel(prob, impact);
    switch (level) {
      case 'critical': return 'rgba(255,77,79,0.3)';
      case 'high': return 'rgba(250,140,22,0.3)';
      case 'medium': return 'rgba(250,173,20,0.2)';
      default: return 'rgba(82,196,26,0.2)';
    }
  };

  // 获取某单元格的风险项
  const getRisksInCell = (prob: number, impact: number) =>
    risks.filter(r => r.probability === prob && r.impact === impact);

  return (
    <svg width={gridSize + labelSize + 20} height={gridSize + labelSize + 20}>
      {/* Y轴标签（概率） */}
      <text x={10} y={gridSize / 2 + labelSize} transform={`rotate(-90, 10, ${gridSize / 2 + labelSize})`}
        textAnchor="middle" fill="var(--text-secondary)" fontSize="12" fontWeight="600">
        发生概率 →
      </text>
      {[5, 4, 3, 2, 1].map((prob, index) => (
        <text key={prob} x={labelSize - 8} y={index * cellSize + cellSize / 2 + labelSize + 8}
          textAnchor="end" fill="var(--text-secondary)" fontSize="12">
          {prob}
        </text>
      ))}

      {/* X轴标签（影响） */}
      <text x={gridSize / 2 + labelSize} y={gridSize + labelSize + 16}
        textAnchor="middle" fill="var(--text-secondary)" fontSize="12" fontWeight="600">
        影响程度 →
      </text>
      {[1, 2, 3, 4, 5].map((impact, index) => (
        <text key={impact} x={index * cellSize + cellSize / 2 + labelSize} y={gridSize + labelSize + 4}
          textAnchor="middle" fill="var(--text-secondary)" fontSize="12">
          {impact}
        </text>
      ))}

      {/* 矩阵单元格 */}
      {[5, 4, 3, 2, 1].map((prob, rowIndex) =>
        [1, 2, 3, 4, 5].map((impact, colIndex) => {
          const cellRisks = getRisksInCell(prob, impact);
          return (
            <g key={`${prob}-${impact}`}
              onClick={() => onCellClick?.(prob, impact)}
              style={{ cursor: 'pointer' }}>
              <rect
                x={colIndex * cellSize + labelSize}
                y={rowIndex * cellSize + labelSize}
                width={cellSize}
                height={cellSize}
                fill={getCellColor(prob, impact)}
                stroke="var(--border-light)"
                strokeWidth="1"
                rx="4"
              />
              {cellRisks.length > 0 && (
                <>
                  <circle
                    cx={colIndex * cellSize + cellSize / 2 + labelSize}
                    cy={rowIndex * cellSize + cellSize / 2 + labelSize}
                    r="14"
                    fill={getRiskLevel(prob, impact).color}
                  />
                  <text
                    x={colIndex * cellSize + cellSize / 2 + labelSize}
                    y={rowIndex * cellSize + cellSize / 2 + labelSize + 5}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {cellRisks.length}
                  </text>
                </>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
};
```

- [ ] 步骤3：实现风险列表和AI分析

```typescript
const RiskMatrix: React.FC = () => {
  const [risks, setRisks] = useState<RiskItem[]>([
    {
      id: '1',
      name: '市场需求不足',
      category: 'market',
      probability: 3,
      impact: 4,
      description: '产品上线后用户需求低于预期',
      mitigation: '先做MVP验证，小范围测试后再全面推广',
      status: 'monitoring',
    },
    {
      id: '2',
      name: '资金链断裂',
      category: 'financial',
      probability: 2,
      impact: 5,
      description: '创业资金消耗过快，无法维持运营',
      mitigation: '制定严格的预算计划，预留6个月运营资金',
      status: 'identified',
    },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [aiAnalysis, setAiAnalysis] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  // 添加风险
  const handleAddRisk = async () => {
    const values = await form.validateFields();
    const newRisk: RiskItem = {
      id: Date.now().toString(),
      ...values,
      probability: Number(values.probability),
      impact: Number(values.impact),
      status: 'identified',
    };
    setRisks(prev => [...prev, newRisk]);
    message.success(`风险「${newRisk.name}」已添加`);
    setIsAddModalOpen(false);
    form.resetFields();
  };

  // 删除风险
  const handleDeleteRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
    message.success('风险已删除');
  };

  /**
   * AI生成风险应对策略
   */
  const handleAIAnalysis = async () => {
    if (risks.length === 0) {
      message.warning('请先添加风险项');
      return;
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('sage')}
你是风险管理专家。请基于以下风险矩阵数据，生成全面的风险评估和应对策略报告。

风险列表：
${risks.map(r => {
      const level = getRiskLevel(r.probability, r.impact);
      return `- ${r.name}（${riskCategories.find(c => c.value === r.category)?.label}）：概率${r.probability}/5，影响${r.impact}/5，等级${levelLabels[level.level]}，描述：${r.description}，已有措施：${r.mitigation}`;
    }).join('\n')}

请按以下格式输出（Markdown）：
## 风险评估总览
（整体风险水平、关键风险项）

## 高优先级风险分析
（概率×影响 ≥ 9的风险项深度分析）

## 风险应对策略
（针对每个高风险项的具体应对措施）

## 风险监控建议
（日常风险监控的机制和频率建议）

## 大学生创业风险提示
（特别针对大学生创业者的风险提醒）`;

    setAiAnalysis({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiAnalysis(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: `请分析${risks.length}个风险项并生成应对策略` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setAiAnalysis(prev => ({ ...prev, content: aiContentRef.current }));
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 2000, token }
      );
      setAiAnalysis(prev => ({ ...prev, isStreaming: false }));
    } catch (error) {
      setAiAnalysis({
        content: '',
        isStreaming: false,
        error: error instanceof Error ? error.message : '分析失败',
      });
      message.error('AI风险分析失败');
    }
  };
```

- [ ] 步骤4：实现完整渲染（矩阵图 + 风险列表 + AI分析）

```typescript
  // 风险表格列定义
  const columns = [
    {
      title: '风险名称', dataIndex: 'name', key: 'name', width: 150,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '类别', dataIndex: 'category', key: 'category', width: 100,
      render: (cat: string) => {
        const c = riskCategories.find(rc => rc.value === cat);
        return <Tag color={c?.color}>{c?.label}</Tag>;
      },
    },
    {
      title: '概率', dataIndex: 'probability', key: 'probability', width: 70,
      render: (p: number) => <Text>{p}/5</Text>,
    },
    {
      title: '影响', dataIndex: 'impact', key: 'impact', width: 70,
      render: (i: number) => <Text>{i}/5</Text>,
    },
    {
      title: '风险等级', key: 'level', width: 100,
      render: (_: unknown, record: RiskItem) => {
        const level = getRiskLevel(record.probability, record.impact);
        return <Tag color={level.color}>{levelLabels[level.level]}</Tag>;
      },
    },
    {
      title: '应对措施', dataIndex: 'mitigation', key: 'mitigation',
      render: (text: string) => <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>,
    },
    {
      title: '操作', key: 'action', width: 60,
      render: (_: unknown, record: RiskItem) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRisk(record.id)} />
      ),
    },
  ];

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<WarningOutlined />} />
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>风险评估矩阵</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>概率×影响 · 可视化 + AI应对策略</div>
            </div>
          </div>
          <Button icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
            添加风险
          </Button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {/* 风险矩阵图 */}
          <Col span={12}>
            <Card title={<span><ExclamationCircleOutlined style={{ marginRight: 8 }} />风险矩阵</span>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RiskMatrixGrid risks={risks} />
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11 }}>
                <span><Badge color="#52c41a" /> 低风险</span>
                <span><Badge color="#faad14" /> 中风险</span>
                <span><Badge color="#fa8c16" /> 高风险</span>
                <span><Badge color="#ff4d4f" /> 极高风险</span>
              </div>
            </Card>
          </Col>
          {/* 风险统计 */}
          <Col span={12}>
            <Card title={<span><SafetyOutlined style={{ marginRight: 8 }} />风险统计</span>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
              <Row gutter={[12, 12]}>
                {(['critical', 'high', 'medium', 'low'] as const).map(level => {
                  const count = risks.filter(r => getRiskLevel(r.probability, r.impact).level === level).length;
                  const colors = { critical: '#ff4d4f', high: '#fa8c16', medium: '#faad14', low: '#52c41a' };
                  return (
                    <Col span={12} key={level}>
                      <div style={{ textAlign: 'center', padding: 16, borderRadius: 8, background: `${colors[level]}10` }}>
                        <div style={{ fontSize: 32, fontWeight: 'bold', color: colors[level] }}>{count}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{levelLabels[level]}</div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <Divider />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <Text strong>总风险数：</Text>{risks.length} 项
                <br />
                <Text strong>需重点关注：</Text>{risks.filter(r => getRiskLevel(r.probability, r.impact).score >= 9).length} 项
              </div>
            </Card>
          </Col>
        </Row>

        {/* 风险列表 */}
        <Card title={<span>风险列表</span>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Table dataSource={risks} columns={columns} rowKey="id" pagination={false} size="small" />
        </Card>

        {/* AI风险分析 */}
        <Card title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI风险应对策略</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAIAnalysis}
              loading={aiAnalysis.isStreaming} disabled={risks.length === 0}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}>
              {aiAnalysis.isStreaming ? '生成中...' : '生成应对策略'}
            </Button>
          }>
          {aiAnalysis.error && <Alert message="分析失败" description={aiAnalysis.error} type="error" showIcon style={{ marginBottom: 12 }} />}
          {aiAnalysis.isStreaming && !aiAnalysis.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" tip="AI正在分析风险..." /></div>
          )}
          {aiAnalysis.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{aiAnalysis.content}</div>
          )}
          {!aiAnalysis.content && !aiAnalysis.isStreaming && !aiAnalysis.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              添加风险项后，点击"生成应对策略"获取AI专业建议
            </div>
          )}
        </Card>
      </div>

      {/* 添加风险弹窗 */}
      <Modal title="添加风险" open={isAddModalOpen} onOk={handleAddRisk}
        onCancel={() => { setIsAddModalOpen(false); form.resetFields(); }}
        okText="添加" cancelText="取消" width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="风险名称" rules={[{ required: true, message: '请输入风险名称' }]}>
            <Input placeholder="例如：技术实现难度超预期" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label="风险类别" rules={[{ required: true }]}>
                <Select placeholder="选择类别">
                  {riskCategories.map(c => <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="probability" label="发生概率(1-5)" rules={[{ required: true }]}>
                <Select placeholder="选择概率">
                  {[1, 2, 3, 4, 5].map(n => <Select.Option key={n} value={n}>{n} - {['很低', '低', '中', '高', '很高'][n-1]}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="impact" label="影响程度(1-5)" rules={[{ required: true }]}>
                <Select placeholder="选择影响">
                  {[1, 2, 3, 4, 5].map(n => <Select.Option key={n} value={n}>{n} - {['很小', '小', '中', '大', '很大'][n-1]}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="风险描述" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="描述该风险的具体内容" />
          </Form.Item>
          <Form.Item name="mitigation" label="应对措施">
            <Input.TextArea rows={2} placeholder="已有的或计划的应对措施" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RiskMatrix;
```

- [ ] 步骤5：验证方法
  - 确认文件无编译错误
  - 测试矩阵图渲染、风险增删、AI分析
  - 验证风险等级颜色区分正确

- [ ] 步骤6：下一步
  - 进入任务4：创建融资规划面板

---

### 任务4：创建融资规划面板

**文件：** Create `src/components/sage/FinancingPanel.tsx`

**目标：** 提供融资阶段规划、资金需求测算、估值计算，AI生成融资策略。

- [ ] 步骤1：定义融资数据类型

```typescript
// src/components/sage/FinancingPanel.tsx

import React, { useState, useRef, useMemo } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Form, InputNumber, Table, Statistic, Progress, message,
} from 'antd';
import {
  DollarOutlined, ThunderboltOutlined, CalculatorOutlined,
  BankOutlined, TrendingUpOutlined, AimOutlined, SaveOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { saveReport } from '../../utils/reportStorage';

const { Text, Title, Paragraph } = Typography;

/**
 * 融资阶段
 */
interface FinancingStage {
  key: string;
  name: string;
  amount: string;          // 融资金额
  valuation: string;       // 估值
  equity: number;          // 出让股份(%)
  purpose: string;         // 资金用途
  timeline: string;        // 预计时间
}

/**
 * 资金用途项
 */
interface FundUsage {
  category: string;
  amount: number;
  percentage: number;
  description: string;
}

/**
 * 估值参数
 */
interface ValuationParams {
  monthlyRevenue: number;       // 月收入
  monthlyGrowthRate: number;    // 月增长率(%)
  industryMultiple: number;     // 行业倍数
  teamScore: number;            // 团队评分(1-10)
  marketScore: number;          // 市场评分(1-10)
}
```

- [ ] 步骤2：实现估值计算和融资阶段规划

```typescript
const financingStageTemplates: FinancingStage[] = [
  { key: 'seed', name: '种子轮', amount: '10-50万', valuation: '100-500万', equity: 10, purpose: '产品原型开发、市场验证', timeline: '0-3个月' },
  { key: 'angel', name: '天使轮', amount: '50-300万', valuation: '500-2000万', equity: 15, purpose: 'MVP开发、获取种子用户', timeline: '3-6个月' },
  { key: 'pre_a', name: 'Pre-A轮', amount: '300-1000万', valuation: '2000-5000万', equity: 12, purpose: '产品迭代、扩大用户规模', timeline: '6-12个月' },
  { key: 'a', name: 'A轮', amount: '1000-5000万', valuation: '5000万-2亿', equity: 20, purpose: '规模化扩张、团队建设', timeline: '12-18个月' },
];

const FinancingPanel: React.FC = () => {
  const [valuationParams, setValuationParams] = useState<ValuationParams>({
    monthlyRevenue: 5,
    monthlyGrowthRate: 20,
    industryMultiple: 8,
    teamScore: 7,
    marketScore: 8,
  });
  const [fundUsages, setFundUsages] = useState<FundUsage[]>([
    { category: '人力成本', amount: 30, percentage: 50, description: '核心团队薪资、外包费用' },
    { category: '技术研发', amount: 15, percentage: 25, description: '服务器、开发工具、第三方服务' },
    { category: '市场推广', amount: 10, percentage: 17, description: '广告投放、内容营销、活动' },
    { category: '运营成本', amount: 5, percentage: 8, description: '办公场地、日常运营' },
  ]);
  const [targetAmount, setTargetAmount] = useState(60); // 目标融资金额(万)
  const [aiAnalysis, setAiAnalysis] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  // 估值计算（简化模型）
  const valuation = useMemo(() => {
    const annualRevenue = valuationParams.monthlyRevenue * 12;
    const growthFactor = 1 + valuationParams.monthlyGrowthRate / 100;
    const projectedRevenue = annualRevenue * Math.pow(growthFactor, 12);
    const teamMultiplier = 0.8 + valuationParams.teamScore * 0.04;
    const marketMultiplier = 0.8 + valuationParams.marketScore * 0.04;
    const estimatedValuation = projectedRevenue * valuationParams.industryMultiple * teamMultiplier * marketMultiplier;
    return {
      annualRevenue: Math.round(annualRevenue * 10) / 10,
      projectedRevenue: Math.round(projectedRevenue * 10) / 10,
      estimatedValuation: Math.round(estimatedValuation * 10) / 10,
      equityToGive: Math.round((targetAmount / estimatedValuation) * 1000) / 10,
    };
  }, [valuationParams, targetAmount]);

  /**
   * AI生成融资策略
   */
  const handleAIFinancingStrategy = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('sage')}
你是融资顾问专家。请基于以下数据生成融资策略报告。

项目数据：
- 月收入：${valuationParams.monthlyRevenue}万
- 月增长率：${valuationParams.monthlyGrowthRate}%
- 行业倍数：${valuationParams.industryMultiple}倍
- 团队评分：${valuationParams.teamScore}/10
- 市场评分：${valuationParams.marketScore}/10
- 预估估值：${valuation.estimatedValuation}万
- 目标融资金额：${targetAmount}万
- 预计出让股份：${valuation.equityToGive}%

资金用途分配：
${fundUsages.map(f => `- ${f.category}：${f.amount}万（${f.percentage}%）- ${f.description}`).join('\n')}

请按以下格式输出（Markdown）：
## 融资策略总览
（融资时机判断、金额合理性）

## 估值分析
（估值方法论、可比公司参考、估值合理性）

## 资金使用规划
（资金分配建议、使用节奏、关键里程碑）

## 投资人画像
（适合的投资人类型、阶段偏好）

## 融资路演建议
（路演重点、常见问题应对）

## 大学生融资特别建议
（针对大学生创业者的融资建议和注意事项）`;

    setAiAnalysis({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiAnalysis(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: `请生成融资策略报告，目标融资${targetAmount}万` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setAiAnalysis(prev => ({ ...prev, content: aiContentRef.current }));
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 2500, token }
      );
      setAiAnalysis(prev => ({ ...prev, isStreaming: false }));
    } catch (error) {
      setAiAnalysis({ content: '', isStreaming: false, error: error instanceof Error ? error.message : '分析失败' });
      message.error('AI融资策略生成失败');
    }
  };
```

- [ ] 步骤3：实现完整渲染（估值计算器 + 融资阶段 + 资金分配 + AI策略）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<DollarOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>融资规划</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>估值计算 · 资金规划 · 融资策略</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {/* 估值计算器 */}
          <Col span={14}>
            <Card title={<span><CalculatorOutlined style={{ marginRight: 8 }} />估值计算器</span>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Text style={{ fontSize: 13 }}>月收入（万元）</Text>
                  <InputNumber value={valuationParams.monthlyRevenue} min={0} style={{ width: '100%', marginTop: 4 }}
                    onChange={v => setValuationParams(prev => ({ ...prev, monthlyRevenue: v || 0 }))} />
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: 13 }}>月增长率（%）</Text>
                  <InputNumber value={valuationParams.monthlyGrowthRate} min={0} max={100} style={{ width: '100%', marginTop: 4 }}
                    onChange={v => setValuationParams(prev => ({ ...prev, monthlyGrowthRate: v || 0 }))} />
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: 13 }}>行业倍数</Text>
                  <InputNumber value={valuationParams.industryMultiple} min={1} max={30} style={{ width: '100%', marginTop: 4 }}
                    onChange={v => setValuationParams(prev => ({ ...prev, industryMultiple: v || 1 }))} />
                </Col>
                <Col span={6}>
                  <Text style={{ fontSize: 13 }}>团队评分</Text>
                  <InputNumber value={valuationParams.teamScore} min={1} max={10} style={{ width: '100%', marginTop: 4 }}
                    onChange={v => setValuationParams(prev => ({ ...prev, teamScore: v || 1 }))} />
                </Col>
                <Col span={6}>
                  <Text style={{ fontSize: 13 }}>市场评分</Text>
                  <InputNumber value={valuationParams.marketScore} min={1} max={10} style={{ width: '100%', marginTop: 4 }}
                    onChange={v => setValuationParams(prev => ({ ...prev, marketScore: v || 1 }))} />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={12}>
                <Col span={8}>
                  <Statistic title="年化收入" value={valuation.annualRevenue} suffix="万" />
                </Col>
                <Col span={8}>
                  <Statistic title="预测年收入" value={valuation.projectedRevenue} suffix="万" />
                </Col>
                <Col span={8}>
                  <Statistic title="预估估值" value={valuation.estimatedValuation} suffix="万"
                    valueStyle={{ color: '#10b981', fontWeight: 'bold' }} />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text style={{ fontSize: 13 }}>目标融资金额（万元）</Text>
                <InputNumber value={targetAmount} min={1} style={{ width: '100%', marginTop: 4 }}
                  onChange={v => setTargetAmount(v || 1)} />
                <div style={{ marginTop: 8, padding: 12, background: 'rgba(16,185,129,0.05)', borderRadius: 8, textAlign: 'center' }}>
                  <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>预计出让股份</Text>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#10b981' }}>{valuation.equityToGive}%</div>
                </div>
              </div>
            </Card>
          </Col>
          {/* 融资阶段路线图 */}
          <Col span={10}>
            <Card title={<span><TrendingUpOutlined style={{ marginRight: 8 }} />融资阶段路线图</span>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
              {financingStageTemplates.map((stage, index) => (
                <div key={stage.key} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: index < financingStageTemplates.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 14 }}>{stage.name}</Text>
                    <Tag color="green">{stage.amount}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    估值：{stage.valuation} · 出让：{stage.equity}% · 时间：{stage.timeline}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stage.purpose}</div>
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {/* 资金分配 */}
        <Card title={<span><AimOutlined style={{ marginRight: 8 }} />资金使用规划</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={16}>
            {fundUsages.map((usage, index) => (
              <Col span={6} key={index}>
                <div style={{ textAlign: 'center', padding: 16, borderRadius: 8, background: 'var(--bg-glass)' }}>
                  <Progress type="circle" percent={usage.percentage} size={64}
                    strokeColor={{ '0%': '#10b981', '100%': '#34d399' }} />
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 'bold' }}>{usage.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{usage.amount}万</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* AI融资策略 */}
        <Card title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI融资策略报告</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAIFinancingStrategy}
              loading={aiAnalysis.isStreaming}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}>
              {aiAnalysis.isStreaming ? '生成中...' : '生成融资策略'}
            </Button>
          }>
          {aiAnalysis.error && <Alert message="生成失败" description={aiAnalysis.error} type="error" showIcon style={{ marginBottom: 12 }} />}
          {aiAnalysis.isStreaming && !aiAnalysis.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" tip="AI正在生成融资策略..." /></div>
          )}
          {aiAnalysis.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{aiAnalysis.content}</div>
          )}
          {!aiAnalysis.content && !aiAnalysis.isStreaming && !aiAnalysis.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              调整估值参数后，点击"生成融资策略"获取专业融资建议
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FinancingPanel;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 测试估值计算器参数调整、计算结果实时更新
  - 测试融资阶段路线图展示
  - 测试AI融资策略生成

- [ ] 步骤5：下一步
  - 进入任务5：更新 SageAI.tsx 整合所有面板

---

### 任务5：更新 SageAI.tsx 整合所有子面板

**文件：** Modify `src/pages/SageAI.tsx`

**目标：** 将4个面板组件整合到 SageAI 页面，更新 App.tsx 子菜单。

- [ ] 步骤1：更新 `src/App.tsx` 中的 sageSubs 菜单定义

```typescript
// src/App.tsx 中修改 sageSubs

const sageSubs: SubMenuItem[] = [
  { key: 'strategy', label: '商业策略' },
  { key: 'canvas', label: '商业模式画布' },
  { key: 'risk', label: '风险评估' },
  { key: 'financing', label: '融资规划' },
];
```

- [ ] 步骤2：更新 `src/pages/SageAI.tsx`

```typescript
// src/pages/SageAI.tsx 完整更新

import React, { useState } from 'react';
import { BulbOutlined, CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import ChatLayout from '../components/ChatLayout';
import StrategyPanel from '../components/sage/StrategyPanel';
import BusinessCanvas from '../components/sage/BusinessCanvas';
import RiskMatrix from '../components/sage/RiskMatrix';
import FinancingPanel from '../components/sage/FinancingPanel';

interface SageAIProps {
  activeFeature?: string | null;
  onFeatureChange?: (feature: string | null) => void;
}

const SageAI: React.FC<SageAIProps> = ({ activeFeature: propFeature, onFeatureChange }) => {
  const [localFeature, setLocalFeature] = useState<string | null>(null);

  const activeFeature = propFeature !== undefined ? propFeature : localFeature;
  const setActiveFeature = onFeatureChange || setLocalFeature;

  const renderFeaturePanel = () => {
    if (!activeFeature) return undefined;

    const panelContent = (() => {
      switch (activeFeature) {
        case 'strategy':
          return <StrategyPanel />;
        case 'canvas':
          return <BusinessCanvas />;
        case 'risk':
          return <RiskMatrix />;
        case 'financing':
          return <FinancingPanel />;
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
        <Button type="text" icon={<CloseOutlined />} size="small"
          onClick={() => setActiveFeature(null)}
          style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        {panelContent}
      </div>
    );
  };

  return (
    <ChatLayout
      role="sage"
      title="军师AI"
      icon={<BulbOutlined />}
      description="商业策略 · 模式画布 · 风险评估 · 融资规划"
      featurePanel={renderFeaturePanel()}
    />
  );
};

export default SageAI;
```

- [ ] 步骤3：验证方法
  - 启动开发服务器 `npm run dev`
  - 登录后进入军师AI页面
  - 依次点击侧边栏子菜单：商业策略、商业模式画布、风险评估、融资规划
  - 确认每个面板都能正确渲染
  - 测试各面板的AI功能

- [ ] 步骤4：最终检查清单
  - [ ] `StrategyPanel.tsx` — 策略生成、流式输出、保存报告
  - [ ] `BusinessCanvas.tsx` — 九宫格编辑、AI填充、localStorage持久化
  - [ ] `RiskMatrix.tsx` — 矩阵图、风险增删、AI应对策略
  - [ ] `FinancingPanel.tsx` — 估值计算、资金分配、AI融资策略
  - [ ] `SageAI.tsx` — 四个子面板切换正常
  - [ ] `App.tsx` — 子菜单显示正确

- [ ] 步骤5：下一步
  - 军师AI模块完成，可进入 Plan-06 工匠AI模块

---

## 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/components/sage/StrategyPanel.tsx` | 新建 | 策略对话面板 |
| `src/components/sage/BusinessCanvas.tsx` | 新建 | 商业模式九宫格画布 |
| `src/components/sage/RiskMatrix.tsx` | 新建 | 风险评估矩阵 |
| `src/components/sage/FinancingPanel.tsx` | 新建 | 融资规划面板 |
| `src/pages/SageAI.tsx` | 修改 | 整合4个子面板 |
| `src/App.tsx` | 修改 | 更新 sageSubs 菜单 |

## 状态管理说明

1. **组件内状态**：各面板组件使用 `useState` 管理本地状态（表单数据、列表数据等）
2. **localStorage持久化**：`BusinessCanvas` 使用 localStorage 自动保存画布数据（key: `sage_business_canvas`）
3. **报告存储**：通过 `saveReport()` 工具函数将AI生成的报告保存到 localStorage（key: `sage_ai_reports`）
4. **AI状态**：每个面板独立的AI流式状态（`isStreaming`、`content`、`error`），互不干扰

## 注意事项

1. **商业模式画布**的九宫格布局严格按照标准 Business Model Canvas 排列
2. **风险矩阵**使用SVG绘制5×5网格，颜色区分低/中/高/极高四个等级
3. **估值计算器**采用简化的收入倍数法，实际使用时需根据行业调整参数
4. **AI输出JSON解析**：BusinessCanvas 的 AI 填充需要从流式输出中提取JSON，使用正则匹配 `\{[\s\S]*\}`
