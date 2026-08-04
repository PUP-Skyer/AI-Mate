/**
 * 行业对标分析面板 - 军师AI Sage 功能组件
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Empty, Spin, Space, Tabs, Statistic, Row, Col, Avatar, Progress, Table, Divider, Badge, Modal } from 'antd';
import { TrophyOutlined, SendOutlined, BarChartOutlined, TeamOutlined, DollarOutlined, RiseOutlined, CheckCircleOutlined, BulbOutlined, AimOutlined, ThunderboltOutlined, SaveOutlined } from '@ant-design/icons';
import { MindMap } from './visualizations';
import { saveReport } from '../../utils/reportStorage';

const { TextArea } = Input;

const industries = [
  { value: 'saas', label: 'SaaS/企业服务', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '💼' },
  { value: 'ecommerce', label: '电商零售', color: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🛒' },
  { value: 'fintech', label: '金融科技', color: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🏦' },
  { value: 'education', label: '在线教育', color: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '📚' },
  { value: 'healthcare', label: '医疗健康', color: '#fa709a', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '🏥' },
  { value: 'media', label: '内容媒体', color: '#ff6a00', gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)', icon: '📺' },
];

const companySizes = [
  { value: 'startup', label: '初创企业', sublabel: '<50?, icon: '🌱' },}
  { value: 'growth', label: '成长, sublabel: '50-200?, icon: '🌿' },
  { value: 'mature', label: '成熟, sublabel: '200-1000?, icon: '🌳' },
  { value: 'enterprise', label: '大型企业', sublabel: '1000', icon: '🏢' },
];

interface BenchmarkAnalysis {}
  id: string;
  title: string;
  industry: string;
  companySize: string;
  status: 'draft' | 'completed';
  createTime: string;
  content: string;


const BenchmarkPanel: React.FC = () => {}
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [savedValues, setSavedValues] = useState<any>({});
  const [detailAnalysis, setDetailAnalysis] = useState<BenchmarkAnalysis | null>(null);
  const [analyses, setAnalyses] = useState<BenchmarkAnalysis[]>([
    {}
      id: 'BM001',
      title: 'SaaS行业对标分析',
      industry: 'saas',
      companySize: 'growth',
      status: 'completed',
      createTime: '2026-04-15',
      content: '与行业领先企业对比，在获客效率和留存率方面存在提升空..',
    ,
    {}
      id: 'BM002',
      title: '电商行业竞争力分,
      industry: 'ecommerce',
      companySize: 'mature',
      status: 'draft',
      createTime: '2026-04-22',
      content: '在转化率和客单价方面与头部企业存在差..',
    ,
  ]);

  const handleGenerate = async () => {}
    const values = await form.validateFields();
    setSavedValues(values);
    setLoading(true);
    try {}
      const generatedContent = generateBenchmarkContent(values);
      setResult(generatedContent);
      const newAnalysis: BenchmarkAnalysis = {}
        id: `BM${Date.now()}`,
        title: values.title,
        industry: values.industry,
        companySize: values.companySize,
        status: 'completed',
        createTime: new Date().toISOString().split('T')[0],
        content: generatedContent,
      ;
      setAnalyses((prev) => [newAnalysis, ...prev]);
      setActiveTab('result');
    } finally {
      setLoading(false);
    
  ;

  const generateBenchmarkContent = (values: any) => {}
    const industryLabel = industries.find(i => i.value === values.industry).label || '';
    const sizeLabel = companySizes.find(s => s.value === values.companySize).label || '';
    return `${values.title}

【对标背景我们{industryLabel}行业，目前处{sizeLabel}阶段。这次对标主要看${values.dimensions.join(') || '综合维度'}，参考对象是行业里的头部玩家}
【数据对比直接说几个关键数字：

营收规模：我000万，行业平均8000万，头部企业2亿。差距确实不小，但考虑发展阶段，这个差距也算正常
增长率：我们25%，行业平0%，头0%。头部企业在快速扩张期，增速快是正常的。我5%其实也不差，关键是能不能持续
毛利率：我们65%，行业平0%，头0%。这点做得不错，说明产品定价和成本控制还行
获客成本：我们50，行业平均00，头部50。这个差距需要重视，头部企业品牌效应强，获客自然便宜
留存率：我们68%，行业平2%，头0%。留存是产品力的体现，这块有提升空间
人效：我0?人，行业平均60万，头部100万。人效低说明要么人多了产出没跟上，要么产出还可以但人不够
【我们的优势1. 产品口碑还行
   - 用户满意度比行业平均%
   - 核心功能体验有竞争力
   - 技术创新能力得到认
2. 盈利能力不错
   - 毛利5%，比行业平均个点
   - 成本控制相对有效
   - 运营流程比较成熟

【差距在哪1. 市场规模偏小
   - 营收只有行业平均2.5%
   - 品牌知名度不如头   - 市场份额有待提升

2. 增长效率不够
   - 获客成本比行业高17%
   - 用户留存比行业低4%
   - 增长率比行业平均%

3. 组织效能偏低
   - 人效比行业低17%
   - 团队规模偏小，影响业务拓   - 有些流程还可以再优化

【怎么追赶
短期内（1-3个月）：
- 获客成本要降下来，优化投放渠道，砍掉效果差的
- 留存率提上去，重点优化新用户体验
- 人效提升10%，优化运营流程，减少重复工作

中期-6个月）：
- 加大市场投入，抢更多市场份额
- 品牌建设搞起来，提升知名- 关键岗位补人，特别是销售和运营

长期-12个月）：
- 技术保持领先，持续投入研发
- 合作伙伴生态建起来
- 看看有没有出海机
【具体行动
优先级最高（这个月就动手）：
- 获客渠道优化：市场团队负责，目标获客成本5%
- 产品留存提升：产品团队负责，目标留存提到72%

优先级中等（2-3个月内）- 扩大市场份额：销售团队负责，目标营收增长20%
- 提升运营效率：运营团队负责，目标人效提升10%

优先级较低（6个月内）- 品牌建设：市场团队负责，目标品牌认知度提0%

【持续跟踪- 每月更新一次对标数据，看看差距是缩小了还是扩大- 每季度复盘一次，评估改进措施的效- 每年调整一次对标目标，根据市场变化和公司发展阶段来
对标不是为了打击信心，而是找到差距、明确方向。我们有自己的优势，也有需要改进的地方，关键是把行动落地。`;
  ;

  const getIndustryConfig = (industry: string) => industries.find(i => i.value === industry) || industries[0];
  const getSizeConfig = (size: string) => companySizes.find(s => s.value === size) || companySizes[0];
  const completedCount = analyses.filter(a => a.status === 'completed').length;
  const completionRate = analyses.length > 0 ? Math.round((completedCount / analyses.length) * 100) : 0;

  // 示例对标数据表格
  const benchmarkData = [
    { metric: '获客成本(CAC)', yourCompany: '¥350', industryAvg: '¥300', topPerformer: '¥150' },
    { metric: '月留存率', yourCompany: '65%', industryAvg: '72%', topPerformer: '88%' },
    { metric: '转化率', yourCompany: '3.2%', industryAvg: '4.5%', topPerformer: '8.0%' },
    { metric: '客单价(ARPU)', yourCompany: '¥800', industryAvg: '¥1200', topPerformer: '¥2500' },
    { metric: '用户生命周期价值(LTV)', yourCompany: '¥3200', industryAvg: '¥5000', topPerformer: '¥12000' },
  ];

  const columns = [
    { title: '指标', dataIndex: 'metric', key: 'metric' },
    { title: '贵公, dataIndex: 'yourCompany', key: 'yourCompany' },}
    { title: '行业平均', dataIndex: 'industryAvg', key: 'industryAvg' },
    { title: '头部企业', dataIndex: 'topPerformer', key: 'topPerformer' },
  ];

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<TrophyOutlined />} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>行业对标分析</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>对标行业标杆，明确竞争定/div>
          </div>
        </div>
        <Row gutter={12}>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{analyses.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>分析总数</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completedCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>已完/div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completionRate}%</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>完成/div>
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 'bold' }}>
          <BarChartOutlined /> 行业选择
        </div>
        <Space wrap>
          {industries.map(industry => (}
            <Tag key={industry.value} color={industry.color} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 13, borderRadius: 16, border: 'none' }} onClick={() => form.setFieldsValue({ industry: industry.value })}>
              <span style={{ marginRight: 4 }}>{industry.icon}</span>{industry.label}
            </Tag>
          ))
        </Space>
      </div>

      <Divider style={{ margin: 0 }} />

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ padding: '0 16px' }} items={[}
        {}
          key: 'create',
          label: <span><BulbOutlined /> 创建分析</span>,
          children: (
            <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
              <Form.Item name="title" label="分析标题" rules={[{ required: true, message: '请输入分析标 }]}>}}
                <Input placeholder="例如：SaaS行业竞争力对标分 prefix={<TrophyOutlined />} style={{ borderRadius: 8 }} size="large" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="industry" label="行业" rules={[{ required: true }]}>
                    <Select placeholder="选择行业" style={{ borderRadius: 8 }} size="large">
                      {industries.map(i => <Select.Option key={i.value} value={i.value}><span style={{ marginRight: 8 }}>{i.icon}</span>{i.label}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="companySize" label="企业规模" rules={[{ required: true }]}>
                    <Select placeholder="选择规模" style={{ borderRadius: 8 }} size="large">
                      {companySizes.map(s => <Select.Option key={s.value} value={s.value}><span style={{ marginRight: 8 }}>{s.icon}</span>{s.label}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="dimensions" label="对标维度">
                    <Select mode="multiple" placeholder="选择维度" style={{ borderRadius: 8 }} size="large">
                        <Select.Option value="acquisition">获客效率</Select.Option>
                        <Select.Option value="retention">留存表现</Select.Option>
                        <Select.Option value="monetization">变现能力</Select.Option>
                        <Select.Option value="efficiency">运营效率</Select.Option>
                        <Select.Option value="product">产品体验</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}><Form.Item name="currentUsers" label="当前用户><Input placeholder="1? style={{ borderRadius: 8 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="currentRevenue" label="月收><Input placeholder="¥50? style={{ borderRadius: 8 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="currentCAC" label="获客成本"><Input placeholder="¥350" style={{ borderRadius: 8 }} /></Form.Item></Col>
              </Row>
              <Form.Item name="competitors" label="主要竞争对手">
                <TextArea placeholder="列出3-5家主要竞争对.." rows={2} style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SendOutlined />} onClick={handleGenerate} loading={loading} block size="large" style={{ borderRadius: 8, height: 44, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                  生成对标分析
                </Button>
              </Form.Item>
            </Form>
          ),
        ,
        {}
          key: 'result',
          label: <span><AimOutlined /> 分析结果</span>,
          children: (
            <Spin spinning={loading}>
              {result ? (}
                <div style={{ marginTop: 16 }}>
                  {/* 对标分析思维导图 */}
                  <Card
                    style={{}}
                      background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      borderRadius: 16,
                      marginBottom: 16,
                    
                    styles={{ body: { padding: 24 } }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>
                      <BarChartOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                      对标分析图谱
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MindMap
                        data={{}}
                          id: 'root',
                          label: '行业对标',
                          color: '#a855f7',
                          children: [
                            {}
                              id: 'metrics',
                              label: '关键指标',
                              color: '#d946ef',
                              children: [
                                { id: 'growth', label: '增长, color: '#f472b6' },}
                                { id: 'retention', label: '留存, color: '#f472b6' },}
                                { id: 'ltv', label: 'LTV', color: '#f472b6' },
                              ],
                            ,
                            {}
                              id: 'benchmark',
                              label: '基准对比',
                              color: '#10b981',
                              children: [
                                { id: 'industry', label: '行业平均', color: '#34d399' },
                                { id: 'top', label: '头部企业', color: '#34d399' },
                              ],
                            ,
                            {}
                              id: 'gap',
                              label: '差距分析',
                              color: '#f59e0b',
                              children: [
                                { id: 'advantage', label: '优势', color: '#fbbf24' },
                                { id: 'weakness', label: '劣势', color: '#fbbf24' },
                              ],
                            ,
                            {}
                              id: 'action',
                              label: '行动计划',
                              color: '#3b82f6',
                              children: [
                                { id: 'short', label: '短期', color: '#60a5fa' },
                                { id: 'long', label: '长期', color: '#60a5fa' },
                              ],
                            ,
                          ],
                        
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
                        onClick={() => {}}
                          saveReport({}
                            title: savedValues.title || '行业对标分析',
                            type: 'benchmark',
                            typeLabel: '行业对标',
                            content: result,
                          );
                        
                        style={{ borderRadius: 8, height: 40 }}
                      >保存分析</Button>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Empty description="请先创建分析" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
              )
            </Spin>
          ),
        ,
        {}
          key: 'data',
          label: <span><BarChartOutlined /> 对标数据</span>,
          children: (
            <>
              <Card size="small" title={<span><BarChartOutlined /> 行业基准对比</span>} style={{ marginBottom: 12, borderRadius: 12 }} styles={{ body: { padding: '16px' } }}>
                <Table dataSource={benchmarkData} columns={columns} pagination={false} size="middle" bordered style={{ borderRadius: 8 }} />
              </Card>
              <Row gutter={12} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Card size="small" style={{ borderRadius: 12, background: '#e6f4ff', border: '1px solid #91caff' }}>
                    <Statistic title={<span style={{ fontSize: 14 }}>行业排名</span>} value="Top 30%" prefix={<ThunderboltOutlined />} styles={{ content: { fontSize: 20, color: '#1890ff' } }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ borderRadius: 12, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <Statistic title={<span style={{ fontSize: 14 }}>综合得分</span>} value={78.5} suffix="/100" prefix={<RiseOutlined />} styles={{ content: { fontSize: 20, color: '#52c41a' } }} />
                  </Card>
                </Col>
              </Row>
            </>
          ),
        ,
        {}
          key: 'library',
          label: <span><CheckCircleOutlined /> 分析/span>,
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{analyses.map((item) => { const industryConfig = getIndustryConfig(item.industry);}}
              const sizeConfig = getSizeConfig(item.companySize);
              return (
                <Card
                  key={item.id}
                  size="small"
                  hoverable
                  onClick={() => setDetailAnalysis(item)}
                  style={{ marginBottom: 12, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s' }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Avatar size={40} style={{ background: industryConfig.gradient, flexShrink: 0 }}>{industryConfig.icon}</Avatar>
                    <div style={{ marginLeft: 12, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>{item.title}</div>
                      <Space size={8}>
                        <Tag color={industryConfig.color} style={{ borderRadius: 4 }}>{industryConfig.icon} {industryConfig.label}</Tag>
                        <Tag style={{ borderRadius: 4 }}>{sizeConfig.icon} {sizeConfig.label}</Tag>
                        <Badge status={item.status === 'completed' ? 'success' : 'processing'} text={item.status === 'completed' ? '已完 : '草稿'} style={{ fontSize: 12 }} />}
                      </Space>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-page)', padding: 12, borderRadius: 8, lineHeight: 1.6 }}>
                    {item.content.substring(0, 100)}...
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{item.createTime}</div>
                </Card>
              ); )
            </div>
          ),
        ,
      ] />
      {/* 分析详情弹窗 */}
      <Modal
        title={null}
        open={!!detailAnalysis}
        onCancel={() => setDetailAnalysis(null)}
        footer={[}
          <Button key="close" onClick={() => setDetailAnalysis(null)}>关闭</Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => {}}
              if (detailAnalysis) {}
                saveReport({}
                  title: detailAnalysis.title,
                  type: 'benchmark',
                  typeLabel: '行业对标',
                  content: detailAnalysis.content,
                );
              
            
          >
            保存分析
          </Button>,
        ]
        width={750}
        styles={{ body: { padding: '24px', maxHeight: '70vh', overflow: 'auto' } }}
      >
        {detailAnalysis && (() => {}}
          const indConfig = getIndustryConfig(detailAnalysis.industry);
          const sizeConfig = getSizeConfig(detailAnalysis.companySize);
          return (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Avatar size={48} style={{ background: indConfig.gradient }}>{indConfig.icon}</Avatar>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{detailAnalysis.title}</div>
                    <Space size={8} style={{ marginTop: 4 }}>
                      <Tag color={indConfig.color}>{indConfig.icon} {indConfig.label}</Tag>
                      <Tag>{sizeConfig.icon} {sizeConfig.label}</Tag>
                      <Badge status={detailAnalysis.status === 'completed' ? 'success' : 'processing'} text={detailAnalysis.status === 'completed' ? '已完 : '草稿'} />}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{detailAnalysis.createTime}</span>
                    </Space>
                  </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
              </div>
              <div style={{}}
                background: '#f8fafc',
                padding: 20,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.9,
                fontSize: 14,
                color: '#334155',
              >
                {detailAnalysis.content}
              </div>
              <Divider style={{ margin: '20px 0' }} />
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" style={{ borderRadius: 10, background: '#e6f4ff', border: '1px solid #91caff' }}>
                    <Statistic title="行业排名" value="Top 30%" prefix={<ThunderboltOutlined />} valueStyle={{ fontSize: 18, color: '#1890ff' }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ borderRadius: 10, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <Statistic title="综合得分" value={78.5} suffix="/100" prefix={<RiseOutlined />} valueStyle={{ fontSize: 18, color: '#52c41a' }} />
                  </Card>
                </Col>
              </Row>
            </div>
          );
        )()
      </Modal>
    </div>
  );
;

export default BenchmarkPanel;
