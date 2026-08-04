# 探路者AI模块 实施计划

> **目标：** 实现探路者AI的市场分析、竞品调研、趋势洞察、机会评估四大核心功能，调用智谱GLM流式接口为大学生创业者提供实时市场情报。
>
> **依赖：** Plan-01（项目基础架构）、Plan-02（API真实化）、Plan-03（AI模型集成）
>
> **技术栈：** React 19 + TypeScript + Ant Design 6 + Zustand + 智谱GLM流式接口 + CSS变量主题系统

---

## 模块概述

探路者AI（ScoutAI）定位为"资源对接专家"，为大学生创业者提供市场情报服务。本计划在现有 `src/components/scout/` 目录基础上，新增4个核心面板并整合到 `ScoutAI.tsx` 页面中。

### 现有代码基础

| 文件路径 | 说明 |
|---------|------|
| `src/pages/ScoutAI.tsx` | 探路者AI主页面，已接入 ChatLayout |
| `src/components/ChatLayout.tsx` | 通用对话布局，支持 featurePanel 插槽 |
| `src/components/scout/MarketAnalysisPanel.tsx` | 现有市场分析面板（使用mock数据） |
| `src/components/scout/IndustryReportPanel.tsx` | 现有行业报告面板 |
| `src/components/scout/SupplierSearchPanel.tsx` | 现有供应商搜索面板 |
| `src/components/scout/PartnerRecommendationPanel.tsx` | 现有合作伙伴推荐面板 |
| `src/components/scout/ResourceComparePanel.tsx` | 现有资源对比面板 |
| `src/services/aiService.ts` | AI服务层，已有 `chatWithZhipuStream` |
| `src/store/aiStore.ts` | Zustand状态管理 |
| `src/App.tsx` | 主应用，scoutSubs 子菜单定义 |

### 子菜单规划（需更新 App.tsx）

```typescript
const scoutSubs: SubMenuItem[] = [
  { key: 'market', label: '市场分析' },        // 任务1
  { key: 'competitor', label: '竞品调研' },    // 任务2
  { key: 'trend', label: '趋势洞察' },         // 任务3
  { key: 'opportunity', label: '机会评估' },   // 任务4
];
```

---

### 任务1：创建市场分析面板（AI流式增强版）

**文件：** Modify `src/components/scout/MarketAnalysisPanel.tsx`

**目标：** 在现有面板基础上，增加"AI深度分析"功能，调用 `chatWithZhipuStream` 流式输出市场分析报告。

- [ ] 步骤1：定义AI分析相关的 Props 和状态类型

```typescript
// src/components/scout/MarketAnalysisPanel.tsx 顶部新增类型定义

import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';
import { Typography, Spin, message } from 'antd';

const { Paragraph } = Typography;

/**
 * AI深度分析结果
 */
interface AIAnalysisResult {
  content: string;           // 流式输出的完整内容
  isStreaming: boolean;      // 是否正在流式输出
  error: string | null;      // 错误信息
}

/**
 * 市场分析请求参数
 */
interface MarketAnalysisRequest {
  industry: string;          // 行业
  region: string;            // 地区
  timeRange: string;         // 时间范围
  analysisDepth: 'overview' | 'deep'; // 分析深度
}
```

- [ ] 步骤2：在组件内部新增AI分析状态与处理函数

```typescript
// 在 MarketAnalysisPanel 组件内部新增

const MarketAnalysisPanel: React.FC = () => {
  // ... 保留现有状态 ...
  
  // 新增：AI分析状态
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult>({
    content: '',
    isStreaming: false,
    error: null,
  });
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const aiContentRef = useRef<string>('');

  /**
   * 调用AI流式接口进行市场深度分析
   */
  const handleDeepAnalysis = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const industryLabel = industryOptions.find(i => i.value === industry)?.label || '全部行业';
    const regionLabel = regionOptions.find(r => r.value === region)?.label || '全部地区';
    
    const systemPrompt = `${getSystemPrompt('scout')}
你现在是专业的市场分析师，请基于以下信息输出结构化的市场分析报告：
- 行业：${industryLabel}
- 地区：${regionLabel}
- 时间范围：${timeRange}

请按以下格式输出（使用Markdown）：
## 市场概况
（市场规模、增长趋势、关键数据）

## 竞争格局
（头部企业、市场份额、竞争态势）

## 用户需求分析
（目标用户画像、痛点、需求趋势）

## 机会与风险
（市场机会点、潜在风险）

## 进入建议
（适合大学生的切入点、启动策略）`;

    const userMessage = `请对${industryLabel}行业在${regionLabel}地区的市场情况进行分析，时间范围：${timeRange}。`;

    setAiAnalysis({ content: '', isStreaming: true, error: null });
    setShowAIAnalysis(true);
    aiContentRef.current = '';

    try {
      await chatWithZhipuStream(
        [{ role: 'user', content: userMessage }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setAiAnalysis(prev => ({
            ...prev,
            content: aiContentRef.current,
          }));
        },
        {
          system_prompt: systemPrompt,
          temperature: 0.7,
          max_tokens: 2000,
          token,
        }
      );
      setAiAnalysis(prev => ({ ...prev, isStreaming: false }));
    } catch (error) {
      setAiAnalysis({
        content: '',
        isStreaming: false,
        error: error instanceof Error ? error.message : 'AI分析失败，请稍后重试',
      });
      message.error('AI深度分析失败，请检查网络后重试');
    }
  };
```

- [ ] 步骤3：在渲染区域新增"AI深度分析"按钮和结果展示区

```typescript
// 在现有 marketData 展示区域之后新增

{/* AI深度分析区 */}
<Card
  title={
    <span>
      <ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />
      AI深度市场分析
    </span>
  }
  style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}
  styles={{ body: { padding: '16px' } }}
  extra={
    <Button
      type="primary"
      icon={<ThunderboltOutlined />}
      onClick={handleDeepAnalysis}
      loading={aiAnalysis.isStreaming}
      disabled={!marketData}
      style={{
        background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)',
        border: 'none',
        borderRadius: 8,
      }}
    >
      {aiAnalysis.isStreaming ? '分析中...' : 'AI深度分析'}
    </Button>
  }
>
  {aiAnalysis.error && (
    <Alert
      message="分析失败"
      description={aiAnalysis.error}
      type="error"
      showIcon
      style={{ marginBottom: 12 }}
    />
  )}
  
  {aiAnalysis.isStreaming && !aiAnalysis.content && (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <Spin size="large" tip="AI正在分析市场数据..." />
    </div>
  )}
  
  {aiAnalysis.content && (
    <div
      className="ai-analysis-content"
      style={{
        lineHeight: 1.8,
        color: 'var(--text-primary)',
        fontSize: 14,
        padding: '8px 0',
      }}
    >
      <div style={{ whiteSpace: 'pre-wrap' }}>{aiAnalysis.content}</div>
      {aiAnalysis.isStreaming && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 16,
            background: '#722ed1',
            marginLeft: 2,
            animation: 'blink 1s infinite',
          }}
        />
      )}
    </div>
  )}
  
  {!aiAnalysis.content && !aiAnalysis.isStreaming && !aiAnalysis.error && (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
      点击"AI深度分析"按钮，获取AI生成的专业市场分析报告
    </div>
  )}
</Card>
```

- [ ] 步骤4：在 `src/index.css` 中新增光标闪烁动画样式

```css
/* src/index.css 新增 */

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.ai-analysis-content h2 {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  margin: 16px 0 8px;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 4px;
}

.ai-analysis-content h3 {
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 600;
  margin: 12px 0 6px;
}
```

- [ ] 步骤5：验证方法
  - 启动开发服务器：`npm run dev`
  - 进入探路者AI > 市场分析功能
  - 选择行业和地区，点击"分析市场行情"获取基础数据
  - 点击"AI深度分析"按钮，观察流式输出效果
  - 验证Markdown格式正确渲染

- [ ] 步骤6：下一步
  - 进入任务2：创建竞品调研面板

---

### 任务2：创建竞品调研面板

**文件：** Create `src/components/scout/CompetitorPanel.tsx`

**目标：** 展示竞品对比矩阵，支持AI生成竞品分析报告。

- [ ] 步骤1：定义组件Props和竞品数据类型

```typescript
// src/components/scout/CompetitorPanel.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Table, Tag, Row, Col, Avatar, Spin, Alert,
  Typography, Space, Empty, Modal, Form, Select, message, Tooltip, Divider,
} from 'antd';
import {
  TrophyOutlined, PlusOutlined, DeleteOutlined, ThunderboltOutlined,
  AimOutlined, CrownOutlined, RiseOutlined, FallOutlined, EyeOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';

const { Text, Title, Paragraph } = Typography;

/**
 * 竞品数据接口
 */
export interface Competitor {
  id: string;
  name: string;              // 竞品名称
  logo?: string;             // Logo URL
  fundingStage: string;      // 融资阶段
  marketShare: number;       // 市场份额(%)
  userScale: string;         // 用户规模
  coreAdvantage: string;     // 核心优势
  weakness: string;          // 劣势
  pricing: string;           // 定价策略
  rating: number;            // 综合评分(1-10)
}

/**
 * 对比维度
 */
interface ComparisonDimension {
  key: string;
  label: string;
  render: (competitor: Competitor) => React.ReactNode;
}

interface CompetitorPanelProps {
  /** 外部传入的竞品列表（可选） */
  initialCompetitors?: Competitor[];
  /** 行业上下文（用于AI分析） */
  industry?: string;
}
```

- [ ] 步骤2：实现竞品对比矩阵表格和添加竞品功能

```typescript
const CompetitorPanel: React.FC<CompetitorPanelProps> = ({
  initialCompetitors = [],
  industry = '通用',
}) => {
  const [competitors, setCompetitors] = useState<Competitor[]>(
    initialCompetitors.length > 0
      ? initialCompetitors
      : [
          {
            id: '1',
            name: '竞品A',
            fundingStage: 'A轮',
            marketShare: 25.5,
            userScale: '50万+',
            coreAdvantage: '技术领先，品牌认知度高',
            weakness: '价格偏高，下沉市场覆盖不足',
            pricing: '高端定价',
            rating: 8,
          },
          {
            id: '2',
            name: '竞品B',
            fundingStage: '天使轮',
            marketShare: 8.3,
            userScale: '10万+',
            coreAdvantage: '价格亲民，迭代速度快',
            weakness: '功能单一，资金有限',
            pricing: '低价策略',
            rating: 6,
          },
        ]
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [aiAnalysis, setAiAnalysis] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  // 对比维度列定义
  const columns = [
    {
      title: '竞品名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 120,
      render: (name: string, record: Competitor) => (
        <Space>
          <Avatar size="small" style={{ background: '#667eea' }}>
            {name.charAt(0)}
          </Avatar>
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '融资阶段',
      dataIndex: 'fundingStage',
      key: 'fundingStage',
      width: 100,
      render: (stage: string) => <Tag color="blue">{stage}</Tag>,
    },
    {
      title: '市场份额',
      dataIndex: 'marketShare',
      key: 'marketShare',
      width: 100,
      sorter: (a: Competitor, b: Competitor) => a.marketShare - b.marketShare,
      render: (share: number) => (
        <span>
          {share}%
          {share > 20 ? (
            <CrownOutlined style={{ color: '#faad14', marginLeft: 4 }} />
          ) : null}
        </span>
      ),
    },
    {
      title: '用户规模',
      dataIndex: 'userScale',
      key: 'userScale',
      width: 100,
    },
    {
      title: '核心优势',
      dataIndex: 'coreAdvantage',
      key: 'coreAdvantage',
      width: 200,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 180 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '主要劣势',
      dataIndex: 'weakness',
      key: 'weakness',
      width: 200,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis type="danger" style={{ maxWidth: 180 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '定价策略',
      dataIndex: 'pricing',
      key: 'pricing',
      width: 100,
      render: (pricing: string) => <Tag color="purple">{pricing}</Tag>,
    },
    {
      title: '综合评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      sorter: (a: Competitor, b: Competitor) => a.rating - b.rating,
      render: (rating: number) => (
        <Tag color={rating >= 8 ? 'gold' : rating >= 6 ? 'green' : 'default'}>
          {rating} / 10
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: Competitor) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            setCompetitors(prev => prev.filter(c => c.id !== record.id));
            message.success(`已删除竞品：${record.name}`);
          }}
        />
      ),
    },
  ];

  // 添加竞品
  const handleAddCompetitor = async () => {
    const values = await form.validateFields();
    const newCompetitor: Competitor = {
      id: Date.now().toString(),
      ...values,
      marketShare: Number(values.marketShare),
      rating: Number(values.rating),
    };
    setCompetitors(prev => [...prev, newCompetitor]);
    message.success(`竞品「${newCompetitor.name}」添加成功`);
    setIsAddModalOpen(false);
    form.resetFields();
  };
```

- [ ] 步骤3：实现AI竞品分析功能

```typescript
  /**
   * AI生成竞品分析报告
   */
  const handleAIAnalysis = async () => {
    if (competitors.length === 0) {
      message.warning('请先添加至少一个竞品');
      return;
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('scout')}
你现在是专业的竞品分析专家。请基于以下竞品数据，生成一份结构化的竞品分析报告。

竞品数据：
${JSON.stringify(competitors.map(c => ({
  name: c.name,
  funding: c.fundingStage,
  marketShare: c.marketShare + '%',
  users: c.userScale,
  advantage: c.coreAdvantage,
  weakness: c.weakness,
  pricing: c.pricing,
  rating: c.rating,
})), null, 2)}

行业背景：${industry}

请按以下格式输出（Markdown）：
## 竞争格局总览
（市场集中度、竞争梯队划分）

## 各竞品深度分析
（逐一分析每个竞品的优劣势）

## 差异化机会
（市场空白点、差异化切入策略）

## 应对策略建议
（针对大学生创业者的具体建议）`;

    setAiAnalysis({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiAnalysis(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: `请分析${industry}行业的竞品情况，共${competitors.length}个竞品。` }],
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
      message.error('AI竞品分析失败');
    }
  };
```

- [ ] 步骤4：实现完整渲染（表格 + 添加弹窗 + AI分析区）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题区 */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<TrophyOutlined />} />
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>竞品调研</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>对比矩阵 + AI深度分析</div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            添加竞品
          </Button>
        </div>
      </div>

      {/* 竞品对比矩阵 */}
      <div style={{ padding: 16 }}>
        <Card
          title={<span><EyeOutlined style={{ marginRight: 8 }} />竞品对比矩阵</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}
        >
          {competitors.length > 0 ? (
            <Table
              dataSource={competitors}
              columns={columns}
              rowKey="id"
              scroll={{ x: 1000 }}
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="暂无竞品数据，请点击右上角添加" />
          )}
        </Card>

        {/* AI竞品分析报告 */}
        <Card
          title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI竞品分析报告</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleAIAnalysis}
              loading={aiAnalysis.isStreaming}
              disabled={competitors.length === 0}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}
            >
              {aiAnalysis.isStreaming ? '生成中...' : '生成AI分析'}
            </Button>
          }
        >
          {aiAnalysis.error && (
            <Alert message="分析失败" description={aiAnalysis.error} type="error" showIcon style={{ marginBottom: 12 }} />
          )}
          {aiAnalysis.isStreaming && !aiAnalysis.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="AI正在生成竞品分析报告..." />
            </div>
          )}
          {aiAnalysis.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14 }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{aiAnalysis.content}</div>
            </div>
          )}
          {!aiAnalysis.content && !aiAnalysis.isStreaming && !aiAnalysis.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              添加竞品后，点击"生成AI分析"获取专业竞品分析报告
            </div>
          )}
        </Card>
      </div>

      {/* 添加竞品弹窗 */}
      <Modal
        title="添加竞品"
        open={isAddModalOpen}
        onOk={handleAddCompetitor}
        onCancel={() => { setIsAddModalOpen(false); form.resetFields(); }}
        okText="添加"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="竞品名称" rules={[{ required: true, message: '请输入竞品名称' }]}>
                <Input placeholder="例如：产品A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fundingStage" label="融资阶段" rules={[{ required: true }]}>
                <Select placeholder="选择融资阶段">
                  {['未融资', '天使轮', 'Pre-A', 'A轮', 'B轮', 'C轮', '已上市'].map(s => (
                    <Select.Option key={s} value={s}>{s}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="marketShare" label="市场份额(%)" rules={[{ required: true }]}>
                <Input type="number" min={0} max={100} placeholder="例如：25.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="userScale" label="用户规模" rules={[{ required: true }]}>
                <Input placeholder="例如：50万+" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="coreAdvantage" label="核心优势" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="描述该竞品的核心竞争优势" />
          </Form.Item>
          <Form.Item name="weakness" label="主要劣势" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="描述该竞品的主要劣势" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pricing" label="定价策略" rules={[{ required: true }]}>
                <Select placeholder="选择定价策略">
                  {['免费', '低价策略', '中端定价', '高端定价', 'Freemium'].map(p => (
                    <Select.Option key={p} value={p}>{p}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rating" label="综合评分(1-10)" rules={[{ required: true }]}>
                <Input type="number" min={1} max={10} placeholder="例如：8" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CompetitorPanel;
```

- [ ] 步骤5：验证方法
  - 确认文件创建成功，无 TypeScript 编译错误
  - 在 ScoutAI 页面中通过 `activeFeature === 'competitor'` 渲染该组件
  - 测试添加竞品、删除竞品、AI分析功能

- [ ] 步骤6：下一步
  - 进入任务3：创建趋势洞察面板

---

### 任务3：创建趋势洞察面板

**文件：** Create `src/components/scout/TrendInsightPanel.tsx`

**目标：** 展示行业趋势数据，支持AI生成趋势预测报告。

- [ ] 步骤1：定义趋势数据类型和组件结构

```typescript
// src/components/scout/TrendInsightPanel.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Select, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Tooltip, Progress, Badge, Space, message,
} from 'antd';
import {
  RiseOutlined, FallOutlined, FireOutlined, ThunderboltOutlined,
  LineChartOutlined, BulbOutlined, GlobalOutlined, ClockCircleOutlined,
  TrendingUpOutlined, AimOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';

const { Text, Paragraph, Title } = Typography;

/**
 * 趋势数据项
 */
interface TrendItem {
  id: string;
  name: string;             // 趋势名称
  category: string;         // 分类
  heatScore: number;        // 热度评分(0-100)
  growthRate: number;       // 增长率(%)
  trend: 'up' | 'down' | 'stable';  // 趋势方向
  description: string;      // 描述
  keyPlayers: string[];     // 关键玩家
  timeToMarket: string;     // 预计爆发时间
}

/**
 * 趋势时间线事件
 */
interface TrendEvent {
  date: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
}
```

- [ ] 步骤2：实现趋势数据生成和AI分析逻辑

```typescript
// 模拟趋势数据
const mockTrends: TrendItem[] = [
  {
    id: '1',
    name: 'AI Agent 应用',
    category: '人工智能',
    heatScore: 95,
    growthRate: 280,
    trend: 'up',
    description: '基于大模型的智能代理应用爆发式增长，覆盖客服、编程、设计等多个领域',
    keyPlayers: ['OpenAI', '智谱AI', '百川智能'],
    timeToMarket: '已爆发',
  },
  {
    id: '2',
    name: '垂直领域大模型',
    category: 'AI模型',
    heatScore: 88,
    growthRate: 150,
    trend: 'up',
    description: '面向特定行业微调的大模型需求激增，医疗、法律、教育领域表现突出',
    keyPlayers: ['Med-PaLM', 'ChatLaw', 'EduChat'],
    timeToMarket: '6-12个月',
  },
  {
    id: '3',
    name: 'AIGC内容合规',
    category: '合规',
    heatScore: 72,
    growthRate: 65,
    trend: 'up',
    description: 'AI生成内容的版权和合规问题受到关注，催生内容检测与标注服务',
    keyPlayers: ['新兴赛道', '政策驱动'],
    timeToMarket: '12-18个月',
  },
];

const mockTimelineEvents: TrendEvent[] = [
  { date: '2026 Q1', event: 'AI Agent开发框架大规模开源', impact: 'high' },
  { date: '2026 Q2', event: '教育部出台AI教育应用规范', impact: 'medium' },
  { date: '2026 Q3', event: '大模型推理成本下降80%', impact: 'high' },
  { date: '2026 Q4', event: '垂直AI应用进入商业化爆发期', impact: 'high' },
];

const TrendInsightPanel: React.FC = () => {
  const [trends, setTrends] = useState<TrendItem[]>(mockTrends);
  const [timelineEvents] = useState<TrendEvent[]>(mockTimelineEvents);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [aiAnalysis, setAiAnalysis] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  const categoryOptions = [
    { value: 'all', label: '全部分类' },
    { value: '人工智能', label: '人工智能' },
    { value: 'AI模型', label: 'AI模型' },
    { value: '合规', label: '合规' },
  ];

  const filteredTrends = selectedCategory === 'all'
    ? trends
    : trends.filter(t => t.category === selectedCategory);

  /**
   * AI生成趋势预测报告
   */
  const handleAITrendAnalysis = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('scout')}
你是专业的行业趋势分析师。基于以下趋势数据，生成未来6-12个月的趋势预测报告。

当前热点趋势：
${trends.map(t => `- ${t.name}（${t.category}）：热度${t.heatScore}，增长率${t.growthRate}%，${t.description}`).join('\n')}

请按以下格式输出（Markdown）：
## 趋势总览
（整体趋势判断、核心驱动力）

## Top 3 机会赛道
（最值得关注的方向及原因）

## 风险预警
（可能的风险和挑战）

## 大学生切入建议
（适合大学生创业者的具体行动建议）`;

    setAiAnalysis({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiAnalysis(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: '请生成行业趋势预测报告' }],
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
      message.error('AI趋势分析失败');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default: return <span style={{ color: '#faad14' }}>—</span>;
    }
  };

  const getHeatColor = (score: number) => {
    if (score >= 80) return '#ff4d4f';
    if (score >= 60) return '#faad14';
    return '#1890ff';
  };
```

- [ ] 步骤3：实现完整渲染（趋势卡片列表 + 时间线 + AI分析区）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<LineChartOutlined />} />
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>趋势洞察</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>捕捉行业风向，把握创业时机</div>
            </div>
          </div>
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 140 }}
            options={categoryOptions}
          />
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 趋势卡片列表 */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {filteredTrends.map(trend => (
            <Col span={24} key={trend.id}>
              <Card
                hoverable
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 16 }}>{trend.name}</Text>
                      <Tag color="blue">{trend.category}</Tag>
                      {trend.heatScore >= 80 && <Tag color="red" icon={<FireOutlined />}>热门</Tag>}
                    </div>
                    <Paragraph style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 13 }}>
                      {trend.description}
                    </Paragraph>
                    <Space size="small" wrap>
                      {trend.keyPlayers.map(player => (
                        <Tag key={player} style={{ fontSize: 11 }}>{player}</Tag>
                      ))}
                    </Space>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 100 }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: getHeatColor(trend.heatScore) }}>
                      {trend.heatScore}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>热度评分</div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ fontSize: 14, color: '#52c41a' }}>
                      {getTrendIcon(trend.trend)} +{trend.growthRate}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>增长率</div>
                  </div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span><ClockCircleOutlined style={{ marginRight: 4 }} />预计爆发：{trend.timeToMarket}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 趋势时间线 */}
        <Card
          title={<span><ClockCircleOutlined style={{ marginRight: 8 }} />趋势时间线</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}
        >
          {timelineEvents.map((event, index) => (
            <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: index < timelineEvents.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <Tag color={event.impact === 'high' ? 'red' : event.impact === 'medium' ? 'orange' : 'blue'}>
                {event.date}
              </Tag>
              <Text style={{ flex: 1 }}>{event.event}</Text>
              <Tag>{event.impact === 'high' ? '高影响' : event.impact === 'medium' ? '中影响' : '低影响'}</Tag>
            </div>
          ))}
        </Card>

        {/* AI趋势分析 */}
        <Card
          title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI趋势预测报告</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleAITrendAnalysis}
              loading={aiAnalysis.isStreaming}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}
            >
              {aiAnalysis.isStreaming ? '生成中...' : '生成预测报告'}
            </Button>
          }
        >
          {aiAnalysis.error && (
            <Alert message="分析失败" description={aiAnalysis.error} type="error" showIcon style={{ marginBottom: 12 }} />
          )}
          {aiAnalysis.isStreaming && !aiAnalysis.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="AI正在分析趋势数据..." />
            </div>
          )}
          {aiAnalysis.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14 }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{aiAnalysis.content}</div>
            </div>
          )}
          {!aiAnalysis.content && !aiAnalysis.isStreaming && !aiAnalysis.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              点击"生成预测报告"，获取AI驱动的趋势预测分析
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TrendInsightPanel;
```

- [ ] 步骤4：验证方法
  - 确认文件创建无编译错误
  - 在 ScoutAI 页面通过 `activeFeature === 'trend'` 渲染
  - 测试分类筛选、趋势卡片展示、AI分析功能

- [ ] 步骤5：下一步
  - 进入任务4：创建机会评估面板

---

### 任务4：创建机会评估面板（雷达图）

**文件：** Create `src/components/scout/OpportunityScorePanel.tsx`

**目标：** 通过雷达图多维度评估创业机会，AI生成机会评估报告。

- [ ] 步骤1：定义评估维度和雷达图数据类型

```typescript
// src/components/scout/OpportunityScorePanel.tsx

import React, { useState, useRef, useMemo } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Slider, Form, Select, message, Tooltip, Progress, Statistic,
} from 'antd';
import {
  AimOutlined, ThunderboltOutlined, RadarChartOutlined,
  CheckCircleOutlined, WarningOutlined, BulbOutlined, StarOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';

const { Text, Title, Paragraph } = Typography;

/**
 * 评估维度
 */
interface ScoreDimension {
  key: string;
  label: string;
  description: string;
  score: number;        // 0-100
  weight: number;       // 权重(0-1)
}

/**
 * 评估结果
 */
interface OpportunityScore {
  totalScore: number;           // 综合评分
  grade: 'A' | 'B' | 'C' | 'D'; // 等级
  recommendation: string;       // 建议
  dimensions: ScoreDimension[];  // 各维度评分
}

/**
 * 默认评估维度
 */
const defaultDimensions: ScoreDimension[] = [
  { key: 'market_size', label: '市场规模', description: '目标市场的总体规模和增长潜力', score: 70, weight: 0.2 },
  { key: 'competition', label: '竞争程度', description: '竞争激烈程度（分数越高代表竞争越少）', score: 60, weight: 0.15 },
  { key: 'feasibility', label: '可行性', description: '技术实现和资源获取的难度', score: 75, weight: 0.2 },
  { key: 'profitability', label: '盈利能力', description: '商业模式盈利空间和变现速度', score: 65, weight: 0.2 },
  { key: 'innovation', label: '创新性', description: '产品或模式的差异化程度', score: 80, weight: 0.1 },
  { key: 'timing', label: '时机', description: '市场进入时机的适宜性', score: 85, weight: 0.15 },
];
```

- [ ] 步骤2：实现雷达图SVG绘制组件

```typescript
/**
 * SVG雷达图组件
 */
const RadarChart: React.FC<{ dimensions: ScoreDimension[]; size?: number }> = ({
  dimensions,
  size = 320,
}) => {
  const center = size / 2;
  const radius = size / 2 - 50;
  const angleStep = (Math.PI * 2) / dimensions.length;

  // 计算各维度坐标点
  const dataPoints = dimensions.map((dim, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const value = (dim.score / 100) * radius;
    return {
      x: center + Math.cos(angle) * value,
      y: center + Math.sin(angle) * value,
      labelX: center + Math.cos(angle) * (radius + 25),
      labelY: center + Math.sin(angle) * (radius + 25),
      angle,
      label: dim.label,
      score: dim.score,
    };
  });

  // 网格圆（4层）
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridLevels.map(level => {
    const points = dimensions.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      return `${center + Math.cos(angle) * radius * level},${center + Math.sin(angle) * radius * level}`;
    }).join(' ');
    return points;
  });

  // 数据多边形路径
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {/* 网格 */}
      {gridPolygons.map((points, index) => (
        <polygon
          key={index}
          points={points}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth="1"
          strokeDasharray={index === gridPolygons.length - 1 ? 'none' : '4,4'}
        />
      ))}
      {/* 轴线 */}
      {dimensions.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * radius}
            y2={center + Math.sin(angle) * radius}
            stroke="var(--border-light)"
            strokeWidth="1"
          />
        );
      })}
      {/* 数据多边形 */}
      <polygon
        points={dataPolygon}
        fill="rgba(114, 46, 209, 0.2)"
        stroke="#722ed1"
        strokeWidth="2"
      />
      {/* 数据点 */}
      {dataPoints.map((point, index) => (
        <g key={index}>
          <circle cx={point.x} cy={point.y} r="4" fill="#722ed1" />
          <text
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--text-secondary)"
            fontSize="12"
            fontWeight="500"
          >
            {point.label}
          </text>
          <text
            x={point.labelX}
            y={point.labelY + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#722ed1"
            fontSize="11"
            fontWeight="bold"
          >
            {point.score}
          </text>
        </g>
      ))}
    </svg>
  );
};
```

- [ ] 步骤3：实现机会评估主组件（含评分调整和AI分析）

```typescript
const OpportunityScorePanel: React.FC = () => {
  const [dimensions, setDimensions] = useState<ScoreDimension[]>(defaultDimensions);
  const [projectName, setProjectName] = useState('');
  const [industry, setIndustry] = useState('tech');
  const [aiAnalysis, setAiAnalysis] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  // 计算综合评分
  const opportunityScore = useMemo<OpportunityScore>(() => {
    const totalScore = dimensions.reduce(
      (sum, dim) => sum + dim.score * dim.weight,
      0
    );
    const roundedScore = Math.round(totalScore);
    let grade: 'A' | 'B' | 'C' | 'D';
    let recommendation: string;
    if (roundedScore >= 80) {
      grade = 'A';
      recommendation = '强烈推荐！该机会综合评分优秀，建议尽快行动';
    } else if (roundedScore >= 65) {
      grade = 'B';
      recommendation = '值得关注。该机会有较好潜力，建议进一步验证';
    } else if (roundedScore >= 50) {
      grade = 'C';
      recommendation = '谨慎考虑。需要加强薄弱环节后再做决定';
    } else {
      grade = 'D';
      recommendation = '风险较高。建议寻找其他方向或大幅调整策略';
    }
    return { totalScore: roundedScore, grade, recommendation, dimensions };
  }, [dimensions]);

  // 更新维度评分
  const handleScoreChange = (key: string, score: number) => {
    setDimensions(prev =>
      prev.map(dim => (dim.key === key ? { ...dim, score } : dim))
    );
  };

  /**
   * AI生成机会评估报告
   */
  const handleAIEvaluation = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const industryLabels: Record<string, string> = {
      tech: '科技', finance: '金融', healthcare: '医疗',
      education: '教育', retail: '零售', manufacturing: '制造',
    };

    const systemPrompt = `${getSystemPrompt('scout')}
你是专业的创业机会评估专家。基于以下评估数据，生成详细的创业机会评估报告。

项目名称：${projectName || '未命名项目'}
行业：${industryLabels[industry] || industry}
综合评分：${opportunityScore.totalScore}（等级${opportunityScore.grade}）

各维度评分：
${dimensions.map(d => `- ${d.label}：${d.score}/100（权重${(d.weight * 100).toFixed(0)}%）- ${d.description}`).join('\n')}

请按以下格式输出（Markdown）：
## 机会评估总览
（综合评分解读、整体判断）

## 各维度深度分析
（逐一分析每个维度的表现和原因）

## 优势与短板
（核心优势、需要改善的短板）

## 行动建议
（具体的下一步行动建议，适合大学生创业者）`;

    setAiAnalysis({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiAnalysis(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: `请评估${projectName || '我的'}创业项目的机会，综合评分${opportunityScore.totalScore}分。` }],
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
        error: error instanceof Error ? error.message : '评估失败',
      });
      message.error('AI机会评估失败');
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#52c41a';
      case 'B': return '#1890ff';
      case 'C': return '#faad14';
      default: return '#ff4d4f';
    }
  };
```

- [ ] 步骤4：实现完整渲染（项目信息 + 雷达图 + 维度调节 + AI报告）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<RadarChartOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>机会评估</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>多维度雷达评估 + AI深度分析</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 项目信息输入 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={12}>
            <Col span={14}>
              <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>项目名称</Text>
              <Input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="输入你的创业项目名称"
                size="large"
              />
            </Col>
            <Col span={10}>
              <Text style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>所属行业</Text>
              <Select
                value={industry}
                onChange={setIndustry}
                style={{ width: '100%' }}
                size="large"
                options={[
                  { value: 'tech', label: '科技' },
                  { value: 'finance', label: '金融' },
                  { value: 'healthcare', label: '医疗' },
                  { value: 'education', label: '教育' },
                  { value: 'retail', label: '零售' },
                  { value: 'manufacturing', label: '制造' },
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* 综合评分 + 雷达图 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={10}>
            <Card
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%', textAlign: 'center' }}
            >
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>综合评分</div>
              <div style={{ fontSize: 56, fontWeight: 'bold', color: getGradeColor(opportunityScore.grade), lineHeight: 1 }}>
                {opportunityScore.totalScore}
              </div>
              <Tag
                color={getGradeColor(opportunityScore.grade)}
                style={{ fontSize: 18, padding: '4px 20px', marginTop: 12, borderRadius: 20 }}
              >
                等级 {opportunityScore.grade}
              </Tag>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {opportunityScore.grade === 'A' || opportunityScore.grade === 'B' ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <WarningOutlined style={{ color: '#faad14' }} />
                )}
                <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{opportunityScore.recommendation}</Text>
              </div>
            </Card>
          </Col>
          <Col span={14}>
            <Card
              title={<span><RadarChartOutlined style={{ marginRight: 8 }} />机会雷达图</span>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}
            >
              <RadarChart dimensions={dimensions} size={300} />
            </Card>
          </Col>
        </Row>

        {/* 维度评分调节 */}
        <Card
          title={<span><AimOutlined style={{ marginRight: 8 }} />维度评分调节</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}
        >
          {dimensions.map(dim => (
            <div key={dim.key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Tooltip title={dim.description}>
                  <Text strong style={{ fontSize: 13 }}>
                    {dim.label}
                    <Tag style={{ marginLeft: 8, fontSize: 11 }}>权重 {(dim.weight * 100).toFixed(0)}%</Tag>
                  </Text>
                </Tooltip>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#722ed1' }}>{dim.score}</Text>
              </div>
              <Slider
                min={0}
                max={100}
                value={dim.score}
                onChange={value => handleScoreChange(dim.key, value)}
                marks={{ 0: '0', 50: '50', 100: '100' }}
              />
            </div>
          ))}
        </Card>

        {/* AI机会评估报告 */}
        <Card
          title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI机会评估报告</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleAIEvaluation}
              loading={aiAnalysis.isStreaming}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}
            >
              {aiAnalysis.isStreaming ? '生成中...' : '生成评估报告'}
            </Button>
          }
        >
          {aiAnalysis.error && (
            <Alert message="评估失败" description={aiAnalysis.error} type="error" showIcon style={{ marginBottom: 12 }} />
          )}
          {aiAnalysis.isStreaming && !aiAnalysis.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="AI正在生成评估报告..." />
            </div>
          )}
          {aiAnalysis.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14 }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{aiAnalysis.content}</div>
            </div>
          )}
          {!aiAnalysis.content && !aiAnalysis.isStreaming && !aiAnalysis.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              调节维度评分后，点击"生成评估报告"获取AI专业评估
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OpportunityScorePanel;
```

- [ ] 步骤5：验证方法
  - 确认文件无编译错误
  - 在 ScoutAI 页面通过 `activeFeature === 'opportunity'` 渲染
  - 测试雷达图绘制、维度滑块调节、综合评分计算、AI报告生成

- [ ] 步骤6：下一步
  - 进入任务5：更新 ScoutAI.tsx 整合所有面板

---

### 任务5：更新 ScoutAI.tsx 整合所有子面板

**文件：** Modify `src/pages/ScoutAI.tsx`

**目标：** 将4个面板组件整合到 ScoutAI 页面，更新 App.tsx 子菜单。

- [ ] 步骤1：更新 `src/App.tsx` 中的 scoutSubs 菜单定义

```typescript
// src/App.tsx 中修改 scoutSubs

const scoutSubs: SubMenuItem[] = [
  { key: 'market', label: '市场分析' },
  { key: 'competitor', label: '竞品调研' },
  { key: 'trend', label: '趋势洞察' },
  { key: 'opportunity', label: '机会评估' },
];
```

- [ ] 步骤2：更新 `src/pages/ScoutAI.tsx`，引入新组件并完善 switch 分支

```typescript
// src/pages/ScoutAI.tsx 完整更新

import React, { useState } from 'react';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import ChatLayout from '../components/ChatLayout';
import MarketAnalysisPanel from '../components/scout/MarketAnalysisPanel';
import CompetitorPanel from '../components/scout/CompetitorPanel';
import TrendInsightPanel from '../components/scout/TrendInsightPanel';
import OpportunityScorePanel from '../components/scout/OpportunityScorePanel';

interface ScoutAIProps {
  activeFeature?: string | null;
  onFeatureChange?: (feature: string | null) => void;
}

const ScoutAI: React.FC<ScoutAIProps> = ({ activeFeature: propFeature, onFeatureChange }) => {
  const [localFeature, setLocalFeature] = useState<string | null>(null);

  const activeFeature = propFeature !== undefined ? propFeature : localFeature;
  const setActiveFeature = onFeatureChange || setLocalFeature;

  const renderFeaturePanel = () => {
    if (!activeFeature) return undefined;

    const panelContent = (() => {
      switch (activeFeature) {
        case 'market':
          return <MarketAnalysisPanel />;
        case 'competitor':
          return <CompetitorPanel />;
        case 'trend':
          return <TrendInsightPanel />;
        case 'opportunity':
          return <OpportunityScorePanel />;
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

  return (
    <ChatLayout
      role="scout"
      title="探路者AI"
      icon={<SearchOutlined />}
      description="市场分析 · 竞品调研 · 趋势洞察 · 机会评估"
      featurePanel={renderFeaturePanel()}
    />
  );
};

export default ScoutAI;
```

- [ ] 步骤3：验证方法
  - 启动开发服务器 `npm run dev`
  - 登录后进入探路者AI页面
  - 依次点击侧边栏子菜单：市场分析、竞品调研、趋势洞察、机会评估
  - 确认每个面板都能正确渲染
  - 测试各面板的AI分析功能是否正常流式输出
  - 验证关闭按钮可正常关闭面板

- [ ] 步骤4：最终检查清单
  - [ ] `MarketAnalysisPanel.tsx` — AI深度分析按钮可流式输出
  - [ ] `CompetitorPanel.tsx` — 竞品表格增删、AI分析正常
  - [ ] `TrendInsightPanel.tsx` — 趋势卡片、时间线、AI预测正常
  - [ ] `OpportunityScorePanel.tsx` — 雷达图、滑块调节、AI评估正常
  - [ ] `ScoutAI.tsx` — 四个子面板切换正常
  - [ ] `App.tsx` — 子菜单显示正确

- [ ] 步骤5：下一步
  - 探路者AI模块完成，可进入 Plan-05 军师AI模块

---

## 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/components/scout/MarketAnalysisPanel.tsx` | 修改 | 增加AI深度分析功能 |
| `src/components/scout/CompetitorPanel.tsx` | 新建 | 竞品调研面板 |
| `src/components/scout/TrendInsightPanel.tsx` | 新建 | 趋势洞察面板 |
| `src/components/scout/OpportunityScorePanel.tsx` | 新建 | 机会评估面板（含雷达图） |
| `src/pages/ScoutAI.tsx` | 修改 | 整合4个子面板 |
| `src/App.tsx` | 修改 | 更新 scoutSubs 菜单 |
| `src/index.css` | 修改 | 新增光标动画样式 |

## 注意事项

1. **AI流式调用**：所有AI分析统一使用 `chatWithZhipuStream`，传入 `getSystemPrompt('scout')` 作为基础提示词
2. **Token获取**：统一使用 `localStorage.getItem('ai-mate-token')` 获取认证Token
3. **样式一致性**：所有面板遵循现有的玻璃态设计风格，使用 CSS 变量（`var(--bg-page)` 等）
4. **错误处理**：AI调用需包裹 try-catch，失败时显示 Alert 提示并重置状态
5. **响应式**：面板宽度由 ChatLayout 的 featurePanel 容器控制（640px），内部布局使用 Row/Col 自适应
