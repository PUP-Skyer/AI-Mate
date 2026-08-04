/**
 * 营销方案制定面板 - 军师AI Sage 功能组件
 * 美化版本 - 添加可视化卡片和图表
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Empty, Spin, Space, Tabs, Row, Col, Avatar, Divider, Badge, Progress, Statistic, Tooltip } from 'antd';
import { MessageOutlined, SendOutlined, RocketOutlined, CheckCircleOutlined, BulbOutlined, ShoppingOutlined, CloudSyncOutlined, GiftOutlined, PieChartOutlined, BarChartOutlined, TeamOutlined, DollarOutlined, RiseOutlined, AimOutlined, ClockCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FlowChart, MindMap } from './visualizations';
import { saveReport } from '../../utils/reportStorage';

const { TextArea } = Input;

const marketingTypes = [
  { value: 'brand', label: '品牌营销', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '🏆', description: '提升品牌知名度与美誉�? },
  { value: 'social', label: '社交营销', color: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '📱', description: '社交媒体平台精准触达' },
  { value: 'content', label: '内容营销', color: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '📝', description: '优质内容驱动用户增长' },
  { value: 'event', label: '活动营销', color: '#fa709a', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '🎉', description: '线上线下活动引爆流量' },
  { value: 'channel', label: '渠道营销', color: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🔗', description: '多渠道整合营销推广' },
  { value: 'growth', label: '增长营销', color: '#ff6a00', gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)', icon: '🚀', description: '数据驱动的增长黑�? },
];

const targetAudiences = [
  { value: 'B2B', label: '企业客户', icon: '🏢', description: '面向企业级客户群�? },
  { value: 'B2C', label: '消费�?, icon: '👥', description: '面向个人消费者群�? },
  { value: 'mixed', label: '混合', icon: '🔄', description: '同时覆盖B端和C�? },
];

// 预算分配可视化数�?const budgetAllocation = [
  { channel: '社交媒体', percentage: 35, color: '#667eea', icon: <CloudSyncOutlined /> },
  { channel: '搜索引擎', percentage: 20, color: '#4facfe', icon: <AimOutlined /> },
  { channel: '内容平台', percentage: 25, color: '#43e97b', icon: <GiftOutlined /> },
  { channel: 'KOL合作', percentage: 15, color: '#f093fb', icon: <TeamOutlined /> },
  { channel: '其他渠道', percentage: 5, color: '#fa709a', icon: <ShoppingOutlined /> },
];

interface MarketingPlan {
  id: string;
  title: string;
  type: string;
  audience: string;
  budget: string;
  status: 'draft' | 'completed';
  createTime: string;
  content: string;
}

const MarketingPlanPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [selectedType, setSelectedType] = useState('brand');
  const [selectedAudience, setSelectedAudience] = useState('');
  const [savedValues, setSavedValues] = useState<any>({});
  const { isDarkMode } = useTheme();

  const [plans, setPlans] = useState<MarketingPlan[]>([
    {
      id: 'MP001',
      title: 'Q2社交媒体推广方案',
      type: 'social',
      audience: 'B2C',
      budget: '50000',
      status: 'completed',
      createTime: '2026-04-10',
      content: '通过小红书、抖音等平台进行品牌曝光，预计触�?0万用�?..',
    },
    {
      id: 'MP002',
      title: '产品发布会策�?,
      type: 'event',
      audience: 'mixed',
      budget: '100000',
      status: 'completed',
      createTime: '2026-04-20',
      content: '举办线上线下结合的产品发布会，邀请行业KOL和媒�?..',
    },
    {
      id: 'MP003',
      title: 'KOL合作计划',
      type: 'growth',
      audience: 'B2C',
      budget: '80000',
      status: 'draft',
      createTime: '2026-04-25',
      content: '与行业头部KOL合作，提升品牌影响力和产品知名度...',
    },
  ]);

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setSavedValues(values);
    setLoading(true);
    try {
      const generatedContent = generateMarketingContent(values);
      setResult(generatedContent);
      const newPlan: MarketingPlan = {
        id: `MP${Date.now()}`,
        title: values.title,
        type: values.marketingType,
        audience: values.targetAudience,
        budget: values.budget,
        status: 'completed',
        createTime: new Date().toISOString().split('T')[0],
        content: generatedContent,
      };
      setPlans((prev) => [newPlan, ...prev]);
      setActiveTab('result');
    } finally {
      setLoading(false);
    }
  };

  const generateMarketingContent = (values: any) => {
    const typeLabel = marketingTypes.find(t => t.value === values.marketingType)?.label || '';
    const audienceLabel = targetAudiences.find(a => a.value === values.targetAudience)?.label || '';
    const budget = parseInt(values.budget || 0);
    return `${values.title}

【方案概述】这次主�?{typeLabel}，目标人群是${audienceLabel}。预�?{budget.toLocaleString()}，周�?{values.duration || '3个月'}�?核心目标就三个：
- 曝光：触�?{values.targetReach || '50�?}用户
- 获客：新�?{values.targetAcquisition || '1�?}用户  
- 转化：整体转化率达到${values.targetConversion || '5%'}

【分阶段打法�?第一阶段（前2周）：造势预热
别一上来就硬推，先让市场知道我们要搞事情�?- 在社交媒体上埋几个话题，让核心用户先讨论起来
- 找几个垂直领域的KOL，让他们提前体验产品，发点预热内�?- 准备一批种草素材，等正式推广时一起释�?
第二阶段（第3-6周）：集中爆�?这时候预算要集中砸，争取短期内打出声量�?- 核心广告渠道全力投放，重点测试几个素材方�?- 搞一场线上活动，比如直播、挑战赛之类的，制造话�?- 各渠道同步推，让用户在哪都能看到我们

第三阶段（第7-12周）：持续收�?热度起来后，要把流量接住，变成实际用户�?- 引导用户分享使用体验，用真实口碑带动新用�?- 每周看数据，效果好的渠道加投，效果差的砍�?- 长尾内容持续发，保持品牌在用户视野里

【预算分配思路】�?{budget.toLocaleString()}怎么花：
- 社交媒体�?5%，约¥${(budget * 0.35).toLocaleString()}）：主打曝光，让更多人知�?- 内容平台�?5%，约¥${(budget * 0.25).toLocaleString()}）：做深度种草，建立信任
- 搜索引擎�?0%，约¥${(budget * 0.2).toLocaleString()}）：抓精准需求，直接转化
- KOL合作�?5%，约¥${(budget * 0.15).toLocaleString()}）：借信任背书，快速获�?- 其他�?%，约¥${(budget * 0.05).toLocaleString()}）：测试新渠道，留点机动预算

【内容方向】别光讲产品功能，多讲用户能得到的实际好处�?- 真实用户故事：找几个典型用户，讲讲他们怎么用产品解决问题的
- 场景化展示：不是"我们的产品很�?，而是"你在XX场景下可以这样用"
- 行业干货：分享一些行业洞察，建立专业形象

【怎么监控效果�?- 每天看：流量、曝光、点击，发现异常及时调整
- 每周看：转化成本、ROI，判断哪个渠道值得继续�?- 每月复盘：整体效果、用户质量，决定下阶段策�?
【预期结果】如果执行到位，预计�?- 品牌曝光${values.targetReach || '50�?}+
- 新增用户${values.targetAcquisition || '1�?}+
- 整体ROI达到1:3以上

当然，实际效果要看素材质量和执行细节，过程中要随时调整。`;
  };

  const getTypeConfig = (type: string) => marketingTypes.find(t => t.value === type) || marketingTypes[0];
  const completedCount = plans.filter(p => p.status === 'completed').length;
  const completionRate = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;
  const totalBudget = plans.reduce((sum, p) => sum + parseInt(p.budget || 0), 0);

  return (
    <div style={{ background: isDarkMode ? '#0d1117' : 'var(--bg-page)', borderRadius: 16, overflow: 'hidden', boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)' }}>
      {/* 顶部渐变标题�?*/}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '24px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰性背�?*/}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -20,
          left: '40%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <Avatar size={44} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }} icon={<MessageOutlined />} />
          <div style={{ marginLeft: 14 }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>营销方案制定</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>制定高效营销方案，提升品牌影响力</div>
          </div>
        </div>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 12, 
              padding: '14px 8px', 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{plans.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>方案总数</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 12, 
              padding: '14px 8px', 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completedCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>已完�?/div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 12, 
              padding: '14px 8px', 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completionRate}%</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>完成�?/div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 12, 
              padding: '14px 8px', 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>¥{(totalBudget / 10000).toFixed(1)}�?/div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>总预�?/div>
            </div>
          </Col>
        </Row>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        style={{ padding: '0 20px' }} 
        items={[
          {
            key: 'create',
            label: <span><BulbOutlined /> 创建方案</span>,
            children: (
              <div style={{ padding: '20px 0' }}>
                {/* 营销类型选择 - 可视化卡�?*/}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 16, fontWeight: 600 }}>
                    <ShoppingOutlined style={{ marginRight: 8 }} /> 选择营销类型
                  </div>
                  <Row gutter={[12, 12]}>
                    {marketingTypes.map(type => (
                      <Col span={8} key={type.value}>
                        <Card
                          hoverable
                          onClick={() => {
                            setSelectedType(type.value);
                            form.setFieldsValue({ marketingType: type.value });
                          }}
                          style={{
                            borderRadius: 12,
                            border: selectedType === type.value ? `2px solid ${type.color}` : (isDarkMode ? '1px solid #30363d' : '1px solid var(--border-light)'),
                            background: selectedType === type.value ? (isDarkMode ? `${type.color}20` : `${type.color}10`) : (isDarkMode ? '#161b22' : '#fff'),
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: selectedType === type.value ? 'scale(1.02)' : 'scale(1)',
                          }}
                          styles={{ body: { padding: '16px', textAlign: 'center' } }}
                        >
                          <Avatar 
                            size={48} 
                            style={{ 
                              background: type.gradient, 
                              marginBottom: 12,
                              boxShadow: selectedType === type.value ? `0 4px 12px ${type.color}40` : 'none',
                            }} 
                          >
                            {type.icon}
                          </Avatar>
                          <div style={{ fontWeight: 600, fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 4 }}>
                            {type.label}
                          </div>
                          <div style={{ fontSize: 12, color: isDarkMode ? '#8b949e' : '#999' }}>
                            {type.description}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                <Divider style={{ borderColor: isDarkMode ? '#30363d' : undefined }} />

                {/* 目标人群选择 - 卡片 */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 16, fontWeight: 600 }}>
                    <TeamOutlined style={{ marginRight: 8 }} /> 选择目标人群
                  </div>
                  <Row gutter={[12, 12]}>
                    {targetAudiences.map(audience => (
                      <Col span={8} key={audience.value}>
                        <Card
                          hoverable
                          onClick={() => {
                            setSelectedAudience(audience.value);
                            form.setFieldsValue({ targetAudience: audience.value });
                          }}
                          style={{
                            borderRadius: 12,
                            border: selectedAudience === audience.value ? '2px solid #667eea' : (isDarkMode ? '1px solid #30363d' : '1px solid var(--border-light)'),
                            background: selectedAudience === audience.value ? (isDarkMode ? '#1f6feb20' : '#f0f5ff') : (isDarkMode ? '#161b22' : '#fff'),
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                          styles={{ body: { padding: '16px' } }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              size={40} 
                              style={{ 
                                background: selectedAudience === audience.value ? '#667eea' : (isDarkMode ? '#30363d' : '#f0f0f0'),
                                color: selectedAudience === audience.value ? '#fff' : (isDarkMode ? '#8b949e' : '#666'),
                                fontSize: 18,
                              }}
                            >
                              {audience.icon}
                            </Avatar>
                            <div style={{ marginLeft: 12, flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 15, color: isDarkMode ? '#c9d1d9' : '#333' }}>
                                {audience.label}
                              </div>
                              <div style={{ fontSize: 12, color: isDarkMode ? '#8b949e' : '#999', marginTop: 2 }}>
                                {audience.description}
                              </div>
                            </div>
                            {selectedAudience === audience.value && (
                              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                            )}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                <Divider style={{ borderColor: isDarkMode ? '#30363d' : undefined }} />

                {/* 预算分配可视�?*/}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 16, fontWeight: 600 }}>
                    <PieChartOutlined style={{ marginRight: 8 }} /> 预算分配建议
                  </div>
                  <Card 
                    style={{ 
                      borderRadius: 12, 
                      background: isDarkMode ? '#161b22' : '#fff',
                      border: isDarkMode ? '1px solid #30363d' : '1px solid var(--border-light)',
                    }}
                    styles={{ body: { padding: '20px' } }}
                  >
                    <Row gutter={[16, 16]}>
                      {budgetAllocation.map((item, index) => (
                        <Col span={12} key={index}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <Avatar size={32} style={{ background: `${item.color}20`, color: item.color, marginRight: 10 }}>
                              {item.icon}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: isDarkMode ? '#c9d1d9' : '#333' }}>{item.channel}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.percentage}%</span>
                              </div>
                              <Progress 
                                percent={item.percentage} 
                                showInfo={false}
                                strokeColor={item.color}
                                railColor={isDarkMode ? '#30363d' : '#f0f0f0'}
                                size="small"
                              />
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </div>

                <Divider style={{ borderColor: isDarkMode ? '#30363d' : undefined }} />

                {/* 表单区域 */}
                <Form form={form} layout="vertical" size="middle">
                  <Form.Item name="title" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>方案标题</span>} rules={[{ required: true, message: '请输入方案标�? }]}>
                    <Input 
                      placeholder="例如：Q2社交媒体推广方案" 
                      prefix={<MessageOutlined />} 
                      style={{ 
                        borderRadius: 10,
                        background: isDarkMode ? '#161b22' : undefined,
                        borderColor: isDarkMode ? '#30363d' : undefined,
                        color: isDarkMode ? '#c9d1d9' : undefined,
                      }} 
                      size="large" 
                    />
                  </Form.Item>
                  
                  {/* 隐藏字段 */}
                  <Form.Item name="marketingType" hidden><Input /></Form.Item>
                  <Form.Item name="targetAudience" hidden><Input /></Form.Item>
                  
                  {/* 已选择展示 */}
                  <div style={{ marginBottom: 16, padding: '12px 16px', background: isDarkMode ? '#161b22' : 'var(--bg-page)', borderRadius: 10, border: isDarkMode ? '1px solid #30363d' : '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 13, color: isDarkMode ? '#8b949e' : '#666', marginBottom: 8 }}>已选择</div>
                    <Space>
                      {selectedType && (
                        <Tag color={getTypeConfig(selectedType).color} style={{ borderRadius: 6, padding: '4px 12px' }}>
                          {getTypeConfig(selectedType).icon} {getTypeConfig(selectedType).label}
                        </Tag>
                      )}
                      {selectedAudience && (
                        <Tag style={{ borderRadius: 6, padding: '4px 12px', background: isDarkMode ? '#21262d' : '#f0f0f0', border: 'none' }}>
                          {targetAudiences.find(a => a.value === selectedAudience)?.icon} {targetAudiences.find(a => a.value === selectedAudience)?.label}
                        </Tag>
                      )}
                      {(!selectedType || !selectedAudience) && (
                        <span style={{ color: isDarkMode ? '#8b949e' : '#999', fontSize: 13 }}>请在上方选择营销类型和目标人�?/span>
                      )}
                    </Space>
                  </div>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="budget" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>预算(�?</span>}>
                        <Input 
                          placeholder="例如50000" 
                          prefix="¥" 
                          style={{ 
                            borderRadius: 10,
                            background: isDarkMode ? '#161b22' : undefined,
                            borderColor: isDarkMode ? '#30363d' : undefined,
                            color: isDarkMode ? '#c9d1d9' : undefined,
                          }} 
                          size="large" 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="duration" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>执行周期</span>}>
                        <Select 
                          placeholder="选择周期" 
                          style={{ borderRadius: 10 }} 
                          size="large"
                          styles={isDarkMode ? { popup: { root: { background: '#161b22' } } } : undefined}
                        >
                          <Select.Option value="1个月">1个月</Select.Option>
                          <Select.Option value="3个月">3个月</Select.Option>
                          <Select.Option value="6个月">6个月</Select.Option>
                          <Select.Option value="1�?>1�?/Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item name="targetReach" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>目标触达</span>}>
                        <Input 
                          placeholder="50�? 
                          style={{ 
                            borderRadius: 10,
                            background: isDarkMode ? '#161b22' : undefined,
                            borderColor: isDarkMode ? '#30363d' : undefined,
                            color: isDarkMode ? '#c9d1d9' : undefined,
                          }} 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="targetAcquisition" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>获客目标</span>}>
                        <Input 
                          placeholder="1�? 
                          style={{ 
                            borderRadius: 10,
                            background: isDarkMode ? '#161b22' : undefined,
                            borderColor: isDarkMode ? '#30363d' : undefined,
                            color: isDarkMode ? '#c9d1d9' : undefined,
                          }} 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="targetConversion" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>转化目标</span>}>
                        <Input 
                          placeholder="5%" 
                          style={{ 
                            borderRadius: 10,
                            background: isDarkMode ? '#161b22' : undefined,
                            borderColor: isDarkMode ? '#30363d' : undefined,
                            color: isDarkMode ? '#c9d1d9' : undefined,
                          }} 
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="description" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>补充说明</span>}>
                    <TextArea 
                      placeholder="描述产品特点、目标人群特征、竞品情况等..." 
                      rows={3} 
                      style={{ 
                        borderRadius: 10,
                        background: isDarkMode ? '#161b22' : undefined,
                        borderColor: isDarkMode ? '#30363d' : undefined,
                        color: isDarkMode ? '#c9d1d9' : undefined,
                      }} 
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
                        borderRadius: 10, 
                        height: 48, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                        border: 'none',
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      生成营销方案
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ),
          },
          {
            key: 'result',
            label: <span><RocketOutlined /> 方案结果</span>,
            children: (
              <Spin spinning={loading}>
                {result ? (
                  <div style={{ marginTop: 20, padding: '0 0 20px' }}>
                    {/* 结果概览卡片 */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                      <Col span={8}>
                        <Card style={{ borderRadius: 12, background: isDarkMode ? '#161b22' : '#f6ffed', border: isDarkMode ? '1px solid #30363d' : '1px solid #b7eb8f' }}>
                          <Statistic
                            title={<span style={{ color: isDarkMode ? '#8b949e' : '#666' }}>预期触达</span>}
                            value={50}
                            suffix="�?
                            styles={{ content: {} }}
                            prefix={<BarChartOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{ borderRadius: 12, background: isDarkMode ? '#161b22' : '#e6f4ff', border: isDarkMode ? '1px solid #30363d' : '1px solid #91caff' }}>
                          <Statistic
                            title={<span style={{ color: isDarkMode ? '#8b949e' : '#666' }}>预期获客</span>}
                            value={1}
                            suffix="�?
                            styles={{ content: {} }}
                            prefix={<TeamOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{ borderRadius: 12, background: isDarkMode ? '#161b22' : '#fff7e6', border: isDarkMode ? '1px solid #30363d' : '1px solid #ffd591' }}>
                          <Statistic
                            title={<span style={{ color: isDarkMode ? '#8b949e' : '#666' }}>预期ROI</span>}
                            value={3}
                            suffix=":1"
                            styles={{ content: {} }}
                            prefix={<RiseOutlined />}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* 营销策略思维导图 */}
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
                        <PieChartOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                        营销策略图谱
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <MindMap
                          data={{
                            id: 'root',
                            label: '营销方案',
                            color: '#a855f7',
                            children: [
                              {
                                id: 'preheat',
                                label: '预热�?,
                                color: '#d946ef',
                                children: [
                                  { id: 'social', label: '社交造势', color: '#f472b6' },
                                  { id: 'kol', label: 'KOL预热', color: '#f472b6' },
                                ],
                              },
                              {
                                id: 'explosion',
                                label: '爆发�?,
                                color: '#10b981',
                                children: [
                                  { id: 'ads', label: '广告投放', color: '#34d399' },
                                  { id: 'event', label: '活动执行', color: '#34d399' },
                                ],
                              },
                              {
                                id: 'sustain',
                                label: '持续�?,
                                color: '#3b82f6',
                                children: [
                                  { id: 'word', label: '口碑运营', color: '#60a5fa' },
                                  { id: 'data', label: '数据分析', color: '#60a5fa' },
                                ],
                              },
                            ],
                          }}
                          width={680}
                          height={380}
                        />
                      </div>
                    </Card>

                    {/* 营销执行流程 */}
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
                            { id: '1', label: '内容制作', color: '#a855f7' },
                            { id: '2', label: '渠道投放', color: '#d946ef' },
                            { id: '3', label: '数据监测', color: '#f472b6' },
                            { id: '4', label: '效果优化', color: '#c084fc' },
                            { id: '5', label: '规模放大', color: '#8b5cf6' },
                          ]}
                          edges={[
                            { from: '1', to: '2', label: '上线' },
                            { from: '2', to: '3', label: '监控' },
                            { from: '3', to: '4', label: '分析' },
                            { from: '4', to: '5', label: '优化' },
                          ]}
                          layout="horizontal"
                          width={680}
                          height={140}
                        />
                      </div>
                    </Card>

                    <Card style={{
                      padding: 20,
                      background: isDarkMode ? '#161b22' : '#f0f5ff',
                      border: isDarkMode ? '1px solid #30363d' : '1px solid #d6e4ff',
                      borderRadius: 12,
                      marginBottom: 16,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.8,
                      fontSize: 14,
                      color: isDarkMode ? '#c9d1d9' : '#333',
                    }}>
                      {result}
                    </Card>
                    <Row gutter={12}>
                      <Col span={12}>
                        <Button onClick={() => setActiveTab('create')} block style={{ borderRadius: 10, height: 44 }}>重新生成</Button>
                      </Col>
                      <Col span={12}>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          block
                          onClick={() => {
                            saveReport({
                              title: savedValues.title || '营销方案制定',
                              type: 'marketing',
                              typeLabel: '营销方案',
                              content: result,
                            });
                          }}
                          style={{ borderRadius: 10, height: 44 }}
                        >保存方案</Button>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <Empty 
                    description={<span style={{ color: isDarkMode ? '#8b949e' : undefined }}>请先创建方案</span>} 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    style={{ marginTop: 40 }} 
                  />
                )}
              </Spin>
            ),
          },
          {
            key: 'library',
            label: <span><CheckCircleOutlined /> 方案�?/span>,
            children: (
              <div style={{ padding: '20px 0' }}>
                {plans.map((item) => { 
                  const typeConfig = getTypeConfig(item.type);
                  return (
                    <Card 
                      key={item.id}
                      size="small" 
                      hoverable 
                      style={{ 
                        marginBottom: 16, 
                        borderRadius: 12, 
                        border: isDarkMode ? '1px solid #30363d' : 'none', 
                        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                        background: isDarkMode ? '#161b22' : '#fff',
                      }} 
                      styles={{ body: { padding: '20px' } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <Avatar 
                          size={44} 
                          style={{ 
                            background: typeConfig.gradient, 
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                        >
                          {typeConfig.icon}
                        </Avatar>
                        <div style={{ marginLeft: 14, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, color: isDarkMode ? '#c9d1d9' : '#1a1a2e', marginBottom: 6 }}>{item.title}</div>
                          <Space size={12}>
                            <Tag color={typeConfig.color} style={{ borderRadius: 4, padding: '2px 10px' }}>{typeConfig.label}</Tag>
                            <Tag style={{ borderRadius: 4, background: isDarkMode ? '#21262d' : '#f0f0f0', border: 'none', color: isDarkMode ? '#c9d1d9' : undefined }}>💰 ¥{parseInt(item.budget || 0).toLocaleString()}</Tag>
                            <Badge status={item.status === 'completed' ? 'success' : 'processing'} text={item.status === 'completed' ? '已完�? : '草稿'} style={{ fontSize: 12 }} />
                          </Space>
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 13, 
                        color: isDarkMode ? '#8b949e' : '#666', 
                        background: isDarkMode ? '#0d1117' : 'var(--bg-page)', 
                        padding: 14, 
                        borderRadius: 10, 
                        lineHeight: 1.6,
                        border: isDarkMode ? '1px solid #30363d' : 'none',
                      }}>
                        {item.content.substring(0, 120)}...
                      </div>
                      <div style={{ marginTop: 12, fontSize: 12, color: isDarkMode ? '#8b949e' : '#999', textAlign: 'right' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />{item.createTime}
                      </div>
                    </Card>
                  ); 
                })}
              </div>
            ),
          },
        ]} 
      />
    </div>
  );
};

export default MarketingPlanPanel;
