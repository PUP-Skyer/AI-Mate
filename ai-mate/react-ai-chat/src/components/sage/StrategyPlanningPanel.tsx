/**
 * 运营策略规划面板 - 军师AI Sage 功能组件
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Empty, Spin, Space, Tabs, Statistic, Row, Col, Avatar, Progress, Badge, Divider } from 'antd';
import { BulbOutlined, SendOutlined, AimOutlined, CheckCircleOutlined, RocketOutlined, FlagOutlined, TrophyOutlined, BookOutlined, BarChartOutlined, PlusOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { MindMap, FlowChart } from './visualizations';
import { saveReport } from '../../utils/reportStorage';

const { TextArea } = Input;

const strategyTypes = [
  { value: 'user_growth', label: '用户增长策略', color: '#1890ff', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '🚀' },
  { value: 'revenue', label: '营收优化策略', color: '#52c41a', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '💰' },
  { value: 'operation', label: '运营效率提升', color: '#faad14', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '�? },
  { value: 'brand', label: '品牌建设策略', color: '#722ed1', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', icon: '🏆' },
  { value: 'product', label: '产品运营策略', color: '#13c2c2', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '📦' },
];

const businessStages = [
  { value: 'startup', label: '初创�?, color: '#1890ff', icon: '🌱' },
  { value: 'growth', label: '成长�?, color: '#52c41a', icon: '🌿' },
  { value: 'mature', label: '成熟�?, color: '#faad14', icon: '🌳' },
  { value: 'transformation', label: '转型�?, color: '#eb2f96', icon: '🔄' },
];

interface StrategyPlan {
  id: string;
  title: string;
  type: string;
  stage: string;
  status: 'draft' | 'completed';
  createTime: string;
  content: string;
}

const StrategyPlanningPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [savedValues, setSavedValues] = useState<any>({});
  const [plans, setPlans] = useState<StrategyPlan[]>([
    {
      id: 'SP001',
      title: 'Q2用户增长策略',
      type: 'user_growth',
      stage: 'growth',
      status: 'completed',
      createTime: '2026-04-15',
      content: '通过社交媒体营销和口碑传播，预计Q2用户增长30%...',
    },
    {
      id: 'SP002',
      title: '营收优化方案',
      type: 'revenue',
      stage: 'mature',
      status: 'draft',
      createTime: '2026-04-20',
      content: '优化定价策略，提升客单价和复购率...',
    },
    {
      id: 'SP003',
      title: '品牌升级策略',
      type: 'brand',
      stage: 'transformation',
      status: 'completed',
      createTime: '2026-04-22',
      content: '全面品牌升级，提升品牌认知度和美誉度...',
    },
  ]);

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setSavedValues(values);
    setLoading(true);
    try {
      const generatedContent = generateStrategyContent(values);
      setResult(generatedContent);

      const newPlan: StrategyPlan = {
        id: `SP${Date.now()}`,
        title: values.title,
        type: values.strategyType,
        stage: values.businessStage,
        status: 'completed',
        createTime: new Date().toISOString().split('T')[0],
        content: generatedContent,
      };
      setPlans((prev) => [newPlan, ...prev]);
      setActiveTab('result');
    } catch (error) {
      console.error('生成策略失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStrategyContent = (values: any) => {
    const stageLabel = businessStages.find(s => s.value === values.businessStage)?.label || '';
    return `${values.title}

【背景分析�?
我们目前处于${stageLabel}，这个阶段的核心任务�?{values.description || '找到产品市场匹配并快速验证商业模�?}。从实际情况来看，需要重点关注用户增长和商业模式验证�?

【目标拆解�?
接下来分三个阶段推进�?

第一个月（短期）�?{values.shortTermGoal || '先把核心数据指标跑起来，重点看用户留存和活跃'}

第三个月（中期）�?{values.midTermGoal || '验证商业模式，找到可持续的获客渠�?}

第六个月（长期）�?{values.longTermGoal || '在细分领域建立一定认知度，形成口碑效�?}

【具体打法�?
1. 先跑通最小闭�?
   - 选一个细分场景切入，别贪�?
   - 快速迭代产品，根据用户反馈调整
   - 核心团队先自己用，找到真实痛�?

2. 找到第一批种子用�?
   - 从身边资源入手，别急着大规模投�?
   - 深度服务早期用户，让他们成为口碑传播�?
   - 建立用户反馈机制，快速响应需�?

3. 数据驱动优化
   - 重点关注留存率，这比新增更重�?
   - 每周复盘关键指标，及时调整策�?
   - 建立简单的数据看板，让团队都能看到进展

【可能遇到的问题�?
- 市场方面：竞品可能会跟进，需要保持迭代速度
- 运营方面：团队人手有限，要聚焦重点，别分散精�?
- 技术方面：初期系统不用太复杂，先满足核心需�?

【需要准备什么�?
- 人：建议1个产品�?个技术�?个运营，小而精
- 钱：前期主要花在用户获取和产品打磨上，控制固定成�?
- 时间：给自己3个月验证期，如果数据不行及时调整方向

以上方案供参考，具体执行时可以根据实际情况灵活调整。`;
  };

  const getTypeConfig = (type: string) => strategyTypes.find(t => t.value === type) || strategyTypes[0];
  const getStageConfig = (stage: string) => businessStages.find(s => s.value === stage) || businessStages[0];

  const completedCount = plans.filter(p => p.status === 'completed').length;
  const draftCount = plans.filter(p => p.status === 'draft').length;
  const completionRate = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;

  return (
    <div style={{ 
      background: 'var(--bg-page)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* 顶部统计�?*/}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<AimOutlined />} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>运营策略规划</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>制定科学的运营策略方�?/div>
          </div>
        </div>
        <Row gutter={12}>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{plans.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>策略总数</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completedCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>已完�?/div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completionRate}%</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>完成�?/div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 策略类型选择 */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 'bold' }}>
          <BarChartOutlined /> 策略类型
        </div>
        <Space wrap>
          {strategyTypes.map(type => (
            <Tag
              key={type.value}
              color={type.color}
              style={{ 
                cursor: 'pointer', 
                padding: '6px 12px', 
                fontSize: 13,
                borderRadius: 16,
                border: 'none',
              }}
              onClick={() => form.setFieldsValue({ strategyType: type.value })}
            >
              <span style={{ marginRight: 4 }}>{type.icon}</span>
              {type.label}
            </Tag>
          ))}
        </Space>
      </div>

      <Divider style={{ margin: 0 }} />

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ padding: '0 16px' }} items={[
        {
          key: 'create',
          label: <span><PlusOutlined /> 创建策略</span>,
          children: (
            <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
              <Form.Item name="title" label="策略标题" rules={[{ required: true, message: '请输入策略标�? }]}>
                <Input 
                  placeholder="例如：Q2用户增长策略" 
                  prefix={<FlagOutlined />} 
                  style={{ borderRadius: 8 }}
                  size="large"
                />
              </Form.Item>
              <Form.Item name="strategyType" label="策略类型" rules={[{ required: true }]}>
                <Select placeholder="选择策略类型" style={{ borderRadius: 8 }} size="large">
                  {strategyTypes.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      <span style={{ marginRight: 8 }}>{type.icon}</span>
                      {type.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="businessStage" label="业务阶段" rules={[{ required: true }]}>
                <Select placeholder="选择业务阶段" style={{ borderRadius: 8 }} size="large">
                  {businessStages.map((stage) => (
                    <Select.Option key={stage.value} value={stage.value}>
                      <span style={{ marginRight: 8 }}>{stage.icon}</span>
                      {stage.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="shortTermGoal" label="短期目标">
                    <Input placeholder="1-3个月" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="midTermGoal" label="中期目标">
                    <Input placeholder="3-6个月" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="longTermGoal" label="长期目标">
                    <Input placeholder="6-12个月" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="业务描述">
                <TextArea 
                  placeholder="描述当前业务状况、面临挑战等..." 
                  rows={3} 
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleGenerate}
                  loading={loading}
                  block
                  size="large"
                  style={{ 
                    borderRadius: 8,
                    height: 44,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  生成策略方案
                </Button>
              </Form.Item>
            </Form>
          ),
        },
        {
          key: 'result',
          label: <span><RocketOutlined /> 生成结果</span>,
          children: (
            <Spin spinning={loading}>
              {result ? (
                <div style={{ marginTop: 16 }}>
                  {/* 思维导图可视�?*/}
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      borderRadius: 16,
                      marginBottom: 16,
                      overflow: 'hidden',
                    }}
                    styles={{ body: { padding: 24 } }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>
                      <BarChartOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                      策略思维导图
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MindMap
                        data={{
                          id: 'root',
                          label: '运营策略',
                          color: '#a855f7',
                          children: [
                            {
                              id: 'goal',
                              label: '目标设定',
                              color: '#d946ef',
                              children: [
                                { id: 'short', label: '短期目标', color: '#f472b6' },
                                { id: 'mid', label: '中期目标', color: '#f472b6' },
                                { id: 'long', label: '长期目标', color: '#f472b6' },
                              ],
                            },
                            {
                              id: 'strategy',
                              label: '策略分析',
                              color: '#10b981',
                              children: [
                                { id: 'core', label: '核心策略', color: '#34d399' },
                                { id: 'plan', label: '执行计划', color: '#34d399' },
                                { id: 'kpi', label: '关键指标', color: '#34d399' },
                              ],
                            },
                            {
                              id: 'risk',
                              label: '风险评估',
                              color: '#f59e0b',
                              children: [
                                { id: 'market', label: '市场风险', color: '#fbbf24' },
                                { id: 'op', label: '运营风险', color: '#fbbf24' },
                                { id: 'tech', label: '技术风�?, color: '#fbbf24' },
                              ],
                            },
                            {
                              id: 'resource',
                              label: '资源需�?,
                              color: '#3b82f6',
                              children: [
                                { id: 'human', label: '人力资源', color: '#60a5fa' },
                                { id: 'budget', label: '预算投入', color: '#60a5fa' },
                                { id: 'time', label: '时间周期', color: '#60a5fa' },
                              ],
                            },
                          ],
                        }}
                        width={680}
                        height={380}
                      />
                    </div>
                  </Card>

                  {/* 执行流程�?*/}
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      borderRadius: 16,
                      marginBottom: 16,
                    }}
                    styles={{ body: { padding: 24 } }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>
                      <RocketOutlined style={{ marginRight: 8, color: '#d946ef' }} />
                      执行流程
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <FlowChart
                        nodes={[
                          { id: '1', label: '基础搭建', color: '#a855f7' },
                          { id: '2', label: '测试验证', color: '#d946ef' },
                          { id: '3', label: '小规模推�?, color: '#f472b6' },
                          { id: '4', label: '优化调整', color: '#c084fc' },
                          { id: '5', label: '全面推广', color: '#8b5cf6' },
                        ]}
                        edges={[
                          { from: '1', to: '2', label: '完成' },
                          { from: '2', to: '3', label: '通过' },
                          { from: '3', to: '4', label: '数据' },
                          { from: '4', to: '5', label: '优化' },
                        ]}
                        layout="horizontal"
                        width={680}
                        height={140}
                      />
                    </div>
                  </Card>

                  <Card
                    style={{
                      padding: 20,
                      background: '#f0f5ff',
                      border: '1px solid #d6e4ff',
                      borderRadius: 12,
                      marginBottom: 16,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.8,
                      fontSize: 14,
                    }}
                  >
                    {result}
                  </Card>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button
                        onClick={() => setActiveTab('create')}
                        icon={<RocketOutlined />}
                        block
                        style={{ borderRadius: 8, height: 40 }}
                      >
                        重新生成
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        block
                        onClick={() => {
                          saveReport({
                            title: savedValues.title || '运营策略规划',
                            type: 'strategy',
                            typeLabel: '运营策略',
                            content: result,
                          });
                        }}
                        style={{ borderRadius: 8, height: 40 }}
                      >
                        保存策略
                      </Button>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Empty
                  description="请先创建策略"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: 40 }}
                />
              )}
            </Spin>
          ),
        },
        {
          key: 'library',
          label: <span><BookOutlined /> 策略�?/span>,
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{plans.map((item, index) => { const typeConfig = getTypeConfig(item.type);
                const stageConfig = getStageConfig(item.stage);
                return (
                  <Card
                    size="small"
                    hoverable
                    style={{
                      marginBottom: 12,
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    styles={{ body: { padding: '16px' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                      <Avatar 
                        size={40} 
                        style={{ 
                          background: typeConfig.gradient,
                          flexShrink: 0,
                        }}
                      >
                        {typeConfig.icon}
                      </Avatar>
                      <div style={{ marginLeft: 12, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>
                              {item.title}
                            </div>
                            <Space size={8}>
                              <Tag color={typeConfig.color} style={{ borderRadius: 4 }}>{typeConfig.label}</Tag>
                              <Tag color={stageConfig.color} style={{ borderRadius: 4 }}>{stageConfig.icon} {stageConfig.label}</Tag>
                            </Space>
                          </div>
                          <Badge 
                            status={item.status === 'completed' ? 'success' : 'processing'} 
                            text={item.status === 'completed' ? '已完�? : '草稿'}
                            style={{ fontSize: 12 }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-page)',
                      padding: '12px',
                      borderRadius: 8,
                      lineHeight: 1.6,
                    }}>
                      {item.content.substring(0, 120)}...
                    </div>
                    <div style={{ 
                      marginTop: 12, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}>
                      <span>编号: {item.id}</span>
                      <span>{item.createTime}</span>
                    </div>
                  </Card>
                ); })}
            </div>
          ),
        },
      ]} />
    </div>
  );
};

export default StrategyPlanningPanel;
