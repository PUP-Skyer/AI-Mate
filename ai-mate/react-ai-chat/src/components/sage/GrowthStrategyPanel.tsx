/**
 * 增长策略建议面板 - 军师AI Sage 功能组件
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Empty, Spin, Space, Tabs, Statistic, Row, Col, Avatar, Progress, Divider, Badge } from 'antd';
import { RiseOutlined, SendOutlined, ArrowUpOutlined, TeamOutlined, DollarOutlined, UserOutlined, CheckCircleOutlined, BulbOutlined, RocketOutlined, LineChartOutlined, SaveOutlined } from '@ant-design/icons';
import { FunnelChart, MindMap } from './visualizations';
import { saveReport } from '../../utils/reportStorage';

const { TextArea } = Input;

const growthStages = [
  { value: 'early', label: '早期增长', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '🌱' },
  { value: 'rapid', label: '快速增�?, color: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🚀' },
  { value: 'stable', label: '稳定增长', color: '#faad14', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '📈' },
  { value: 'breakthrough', label: '突破增长', color: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '💎' },
];

const growthChannels = [
  { value: 'organic', label: '自然增长', icon: '🌿' },
  { value: 'paid', label: '付费增长', icon: '💰' },
  { value: 'viral', label: '病毒传播', icon: '🔥' },
  { value: 'partnership', label: '合作增长', icon: '🤝' },
  { value: 'content', label: '内容驱动', icon: '📝' },
];

interface GrowthStrategy {
  id: string;
  title: string;
  stage: string;
  channel: string;
  target: string;
  status: 'draft' | 'completed';
  createTime: string;
  content: string;
}

const GrowthStrategyPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [savedValues, setSavedValues] = useState<any>({});
  const [strategies, setStrategies] = useState<GrowthStrategy[]>([
    {
      id: 'GS001',
      title: '用户裂变增长计划',
      stage: 'rapid',
      channel: 'viral',
      target: '用户增长50%',
      status: 'completed',
      createTime: '2026-04-12',
      content: '通过推荐奖励机制，实现用户自传播增长...',
    },
    {
      id: 'GS002',
      title: '内容驱动的增长策�?,
      stage: 'stable',
      channel: 'content',
      target: '品牌知名度提�?,
      status: 'draft',
      createTime: '2026-04-25',
      content: '通过高质量内容输出，建立行业影响�?..',
    },
    {
      id: 'GS003',
      title: 'B2B合作增长计划',
      stage: 'breakthrough',
      channel: 'partnership',
      target: '企业客户增长30%',
      status: 'completed',
      createTime: '2026-04-20',
      content: '与行业头部企业建立战略合作，共享客户资源...',
    },
  ]);

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setSavedValues(values);
    setLoading(true);
    try {
      const generatedContent = generateGrowthContent(values);
      setResult(generatedContent);
      const newStrategy: GrowthStrategy = {
        id: `GS${Date.now()}`,
        title: values.title,
        stage: values.growthStage,
        channel: values.growthChannel,
        target: values.growthTarget,
        status: 'completed',
        createTime: new Date().toISOString().split('T')[0],
        content: generatedContent,
      };
      setStrategies((prev) => [newStrategy, ...prev]);
      setActiveTab('result');
    } finally {
      setLoading(false);
    }
  };

  const generateGrowthContent = (values: any) => {
    return `${values.title}

【增长目标�?${values.growthTarget || '未来6个月把用户规模翻一�?}，时间周�?{values.timeframe || '6个月'}，预期增长率${values.growthRate || '100%'}�?
【现状诊断�?看了下目前的数据，几个关键环节的情况�?
获客端：月新�?000，主要靠付费投放。成本在涨，但量没上去，说明渠道效率在下降�?
激活端：激活率60%，也就是10个新用户里有4个没搞懂产品怎么用就走了。这个损失很大�?
留存端：月留�?5%，还行，但比行业头部�?0个点。说明产品粘性还有提升空间�?
变现端：ARPU ¥200，如果能把付费转化率提一提，或者推出更高客单价的服务，增长空间很大�?
传播端：K因子0.3，基本靠自然增长，老用户带新用户的动力不足�?
【增长思路�?
1. 获客：别只盯着付费渠道
- 把效果好的渠道预算加大，效果差的直接砍掉
- 内容营销搞起来，写点行业干货，降低对付费流量的依�?- 设计个邀请机制，让老用户愿意带新用户来

2. 激活：让用户快速感受到价�?- 新用户进来后，别给太多选择，直接引导到核心功能
- 首单优惠或者新手任务，让用户完成第一�?Aha时刻"
- 根据用户类型给不同的引导，别一刀�?
3. 留存：让用户养成使用习惯
- 把用户分成几类：活跃用户、沉默用户、流失用户，分别对待
- 活跃用户给点特权，让他们有成就感
- 沉默用户触发召回，给点福利拉回来
- 流失用户分析原因，看看是产品问题还是竞品抢了

4. 变现：提升单用户价�?- 测试下不同定价，看看用户对价格的敏感�?- 推出会员或者增值服务，给愿意付费的用户更多价�?- 交叉销售，买了A产品的用户推荐B产品

5. 传播：让增长飞轮转起�?- 推荐奖励别只给新用户，老用户也要有动力
- 分享体验做得简单点，一键分享到微信、朋友圈
- 找几个核心用户，给他们特殊权益，让他们成为品牌代言�?
【执行节奏�?
�?个月：把基础打好
- 核心转化漏斗每个环节都优化一�?- 用户分层体系建起�?- A/B测试框架搭好，后面好做实�?
�?-4个月：开始放�?- 有效渠道加大投入
- 裂变活动启动，先小范围测�?- 增值服务上线，看看市场反应

�?-6个月：持续迭�?- 数据好的策略复制放大
- 数据不好的及时调�?- 探索新的增长渠道，为下一阶段做准�?
【关键指标盯紧�?- 北极星指标：活跃用户增长率，这个最能反映增长健康度
- 核心指标：留存率、转化率、ARPU，这三个决定能不能赚�?- 监控指标：获客成本、用户生命周期价值，这两个决定能不能持续

增长是个系统工程，不是某个单点突破就能解决的。各个环节都要抓，但资源有限，先抓最痛的点。`;
  };

  const getStageConfig = (stage: string) => growthStages.find(s => s.value === stage) || growthStages[0];
  const getChannelConfig = (channel: string) => growthChannels.find(c => c.value === channel) || growthChannels[0];
  const completedCount = strategies.filter(s => s.status === 'completed').length;
  const completionRate = strategies.length > 0 ? Math.round((completedCount / strategies.length) * 100) : 0;

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<RiseOutlined />} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>增长策略建议</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>制定科学增长方案，实现业务突�?/div>
          </div>
        </div>
        <Row gutter={12}>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{strategies.length}</div>
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

      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 'bold' }}>
          <LineChartOutlined /> 增长阶段
        </div>
        <Space wrap>
          {growthStages.map(stage => (
            <Tag key={stage.value} color={stage.color} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 13, borderRadius: 16, border: 'none' }} onClick={() => form.setFieldsValue({ growthStage: stage.value })}>
              <span style={{ marginRight: 4 }}>{stage.icon}</span>{stage.label}
            </Tag>
          ))}
        </Space>
      </div>

      <Divider style={{ margin: 0 }} />

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ padding: '0 16px' }} items={[
        {
          key: 'create',
          label: <span><BulbOutlined /> 创建策略</span>,
          children: (
            <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
              <Form.Item name="title" label="策略标题" rules={[{ required: true, message: '请输入策略标�? }]}>
                <Input placeholder="例如：Q2用户增长策略" prefix={<RiseOutlined />} style={{ borderRadius: 8 }} size="large" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="growthStage" label="增长阶段" rules={[{ required: true }]}>
                    <Select placeholder="选择阶段" style={{ borderRadius: 8 }} size="large">
                      {growthStages.map(s => <Select.Option key={s.value} value={s.value}><span style={{ marginRight: 8 }}>{s.icon}</span>{s.label}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="growthChannel" label="主要渠道" rules={[{ required: true }]}>
                    <Select placeholder="选择渠道" style={{ borderRadius: 8 }} size="large">
                      {growthChannels.map(c => <Select.Option key={c.value} value={c.value}><span style={{ marginRight: 8 }}>{c.icon}</span>{c.label}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="growthTarget" label="增长目标">
                    <Input placeholder="例如：用户增�?0%" prefix={<ArrowUpOutlined />} style={{ borderRadius: 8 }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}><Form.Item name="currentUsers" label="当前用户�?><Input placeholder="1�? style={{ borderRadius: 8 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="currentRetention" label="当前留存�?><Input placeholder="65%" style={{ borderRadius: 8 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="currentCAC" label="获客成本"><Input placeholder="¥200" style={{ borderRadius: 8 }} /></Form.Item></Col>
              </Row>
              <Form.Item name="challenges" label="面临挑战">
                <TextArea placeholder="描述当前增长面临的主要挑�?.." rows={2} style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SendOutlined />} onClick={handleGenerate} loading={loading} block size="large" style={{ borderRadius: 8, height: 44, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                  生成增长策略
                </Button>
              </Form.Item>
            </Form>
          ),
        },
        {
          key: 'result',
          label: <span><RocketOutlined /> 策略结果</span>,
          children: (
            <Spin spinning={loading}>
              {result ? (
                <div style={{ marginTop: 16 }}>
                  {/* 增长漏斗可视�?*/}
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
                      <LineChartOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                      增长漏斗模型
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <FunnelChart
                        data={[
                          { label: '曝光', value: 100000, color: '#a855f7', conversion: 100 },
                          { label: '访问', value: 25000, color: '#d946ef', conversion: 25 },
                          { label: '注册', value: 7500, color: '#f472b6', conversion: 30 },
                          { label: '激�?, value: 3000, color: '#c084fc', conversion: 40 },
                          { label: '付费', value: 600, color: '#8b5cf6', conversion: 20 },
                        ]}
                        width={680}
                        height={340}
                      />
                    </div>
                  </Card>

                  {/* 增长策略思维导图 */}
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
                      <BulbOutlined style={{ marginRight: 8, color: '#d946ef' }} />
                      增长策略图谱
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MindMap
                        data={{
                          id: 'root',
                          label: '增长策略',
                          color: '#10b981',
                          children: [
                            {
                              id: 'acq',
                              label: '获客',
                              color: '#34d399',
                              children: [
                                { id: 'seo', label: 'SEO优化', color: '#6ee7b7' },
                                { id: 'ads', label: '广告投放', color: '#6ee7b7' },
                              ],
                            },
                            {
                              id: 'act',
                              label: '激�?,
                              color: '#a855f7',
                              children: [
                                { id: 'guide', label: '新手引导', color: '#c084fc' },
                                { id: 'onboard', label: 'onboarding', color: '#c084fc' },
                              ],
                            },
                            {
                              id: 'ret',
                              label: '留存',
                              color: '#3b82f6',
                              children: [
                                { id: 'push', label: '推送运�?, color: '#60a5fa' },
                                { id: 'community', label: '社群运营', color: '#60a5fa' },
                              ],
                            },
                            {
                              id: 'rev',
                              label: '变现',
                              color: '#f59e0b',
                              children: [
                                { id: 'pricing', label: '定价策略', color: '#fbbf24' },
                                { id: 'upsell', label: '交叉销�?, color: '#fbbf24' },
                              ],
                            },
                          ],
                        }}
                        width={680}
                        height={380}
                      />
                    </div>
                  </Card>

                  <Card style={{ padding: 20, background: '#f0f5ff', border: '1px solid #d6e4ff', borderRadius: 12, marginBottom: 16, whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14 }}>
                    {result}
                  </Card>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button onClick={() => setActiveTab('create')} block style={{ borderRadius: 8, height: 40 }}>重新生成</Button>
                    </Col>
                    <Col span={12}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        block
                        onClick={() => {
                          saveReport({
                            title: savedValues.title || '增长策略建议',
                            type: 'growth',
                            typeLabel: '增长策略',
                            content: result,
                          });
                        }}
                        style={{ borderRadius: 8, height: 40 }}
                      >保存策略</Button>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Empty description="请先创建策略" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
              )}
            </Spin>
          ),
        },
        {
          key: 'library',
          label: <span><CheckCircleOutlined /> 策略�?/span>,
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{strategies.map((item) => { const stageConfig = getStageConfig(item.stage);
              const channelConfig = getChannelConfig(item.channel);
              return (
                <Card size="small" hoverable style={{ marginBottom: 12, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} styles={{ body: { padding: '16px' } }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Avatar size={40} style={{ background: stageConfig.gradient, flexShrink: 0 }}>{stageConfig.icon}</Avatar>
                    <div style={{ marginLeft: 12, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>{item.title}</div>
                      <Space size={8}>
                        <Tag color={stageConfig.color} style={{ borderRadius: 4 }}>{stageConfig.icon} {stageConfig.label}</Tag>
                        <Tag style={{ borderRadius: 4 }}>{channelConfig.icon} {channelConfig.label}</Tag>
                        <Badge status={item.status === 'completed' ? 'success' : 'processing'} text={item.status === 'completed' ? '已完�? : '草稿'} style={{ fontSize: 12 }} />
                      </Space>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-page)', padding: 12, borderRadius: 8, lineHeight: 1.6 }}>
                    {item.content.substring(0, 100)}...
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{item.createTime} · 目标：{item.target}</div>
                </Card>
              ); })}
            </div>
          ),
        },
      ]} />
    </div>
  );
};

export default GrowthStrategyPanel;
