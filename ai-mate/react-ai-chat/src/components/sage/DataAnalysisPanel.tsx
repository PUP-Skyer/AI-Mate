/**
 * 数据分析诊断面板 - 军师AI Sage 功能组件
 * 美化版本 - 添加可视化图表和卡片式布局
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Empty, Spin, Space, Tabs, Statistic, Row, Col, Avatar, Progress, Divider, Badge, Tooltip, Steps, Timeline, Radio } from 'antd';
import { BarChartOutlined, SendOutlined, PieChartOutlined, RiseOutlined, FallOutlined, CheckCircleOutlined, AlertOutlined, BulbOutlined, LineChartOutlined, DashboardOutlined, TrophyOutlined, AimOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, FileTextOutlined, ClockCircleOutlined, UserOutlined, DollarOutlined, ShoppingOutlined, SaveOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MindMap, FunnelChart } from './visualizations';
import { saveReport } from '../../utils/reportStorage';

const { TextArea } = Input;

const analysisTypes = [
  { value: 'comprehensive', label: '全面诊断', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: <DashboardOutlined /> },
  { value: 'user', label: '用户分析', color: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: <UserOutlined /> },
  { value: 'financial', label: '财务分析', color: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: <DollarOutlined /> },
  { value: 'operation', label: '运营分析', color: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: <ShoppingOutlined /> },
  { value: 'product', label: '产品分析', color: '#fa709a', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: <AimOutlined /> },
];

const businessStages = [
  { value: 'startup', label: '初创�?, icon: '🌱', description: '产品验证阶段，关注PMF' },
  { value: 'growth', label: '成长�?, icon: '🌿', description: '快速扩张阶段，关注增长' },
  { value: 'mature', label: '成熟�?, icon: '🌳', description: '稳定运营阶段，关注效�? },
];

// 模拟指标数据
const mockMetrics = [
  { name: '用户增长�?, value: 25, target: 30, unit: '%', status: 'warning' as const, icon: <UserOutlined /> },
  { name: '月留存率', value: 68, target: 72, unit: '%', status: 'warning' as const, icon: <CheckCircleOutlined /> },
  { name: '获客成本', value: 350, target: 300, unit: '¥', status: 'error' as const, icon: <DollarOutlined /> },
  { name: '转化�?, value: 3.2, target: 4.5, unit: '%', status: 'error' as const, icon: <AimOutlined /> },
  { name: 'NPS评分', value: 72, target: 70, unit: '�?, status: 'success' as const, icon: <TrophyOutlined /> },
  { name: '响应时间', value: 2, target: 4, unit: '小时', status: 'success' as const, icon: <ClockCircleOutlined /> },
];

interface Analysis {
  id: string;
  title: string;
  type: string;
  stage: string;
  status: 'draft' | 'completed';
  createTime: string;
  content: string;
}

const DataAnalysisPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [selectedType, setSelectedType] = useState('comprehensive');
  const [selectedStage, setSelectedStage] = useState('');
  const [savedValues, setSavedValues] = useState<any>({});
  const { isDarkMode } = useTheme();

  const [analyses, setAnalyses] = useState<Analysis[]>([
    {
      id: 'DA001',
      title: 'Q2业务全面诊断',
      type: 'comprehensive',
      stage: 'growth',
      status: 'completed',
      createTime: '2026-04-15',
      content: '用户增长�?5%，留存率68%，获客成本高于行业平�?5%...',
    },
    {
      id: 'DA002',
      title: '用户流失分析',
      type: 'user',
      stage: 'growth',
      status: 'completed',
      createTime: '2026-04-22',
      content: '次月留存率下�?2%，主要流失节点在新用户引导环�?..',
    },
  ]);

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setSavedValues(values);
    setLoading(true);
    try {
      const generatedContent = generateAnalysisContent(values);
      setResult(generatedContent);
      const newAnalysis: Analysis = {
        id: `DA${Date.now()}`,
        title: values.title,
        type: values.analysisType,
        stage: values.businessStage,
        status: 'completed',
        createTime: new Date().toISOString().split('T')[0],
        content: generatedContent,
      };
      setAnalyses((prev) => [newAnalysis, ...prev]);
      setActiveTab('result');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysisContent = (values: any) => {
    return `${values.title}

【数据现状】看了下最近的数据，有几个点比较突出：

用户增长这块，目前月�?5%，但行业里做得好的能�?0%，还�?个点的差距。不过考虑到我们目前的资源投入，这个增速也算正常�?留存数据需要重点关注。月留存68%，比行业平均72%低了4个点。特别是新用�?日留存掉到了52%，说明onboarding流程有问题，用户进来后没搞懂产品价值�?获客成本¥350，比行业平均¥300高了17%。近3个月还在涨，这个趋势不太好，得看看投放渠道是不是有问题�?转化�?.2%，离行业平均4.5%差得有点多。不过这也跟流量质量有关，如果前端引流太泛，后端转化自然上不去�?
【做得好的地方�?- NPS 72分，这个确实不错，说明产品本身是有竞争力�?- 客服响应2小时，比大部分竞品快，用户口碑还�?- 品牌认知�?5%，在目标人群里有一定知名度

【需要警惕的�?- 获客成本一直在涨，如果继续这样，ROI会很难看
- 新用户留存掉得厉害，可能是产品引导没做好
- 竞品最近动作不少，市场份额有被蚕食的风�?
【建议怎么改�?
当务之急（这周就动手）�?- 把新用户引导流程重新梳理一遍，重点讲清楚核心价�?- 看看投放渠道的数据，砍掉效果差的，加大有效渠道的投入
- 建个简单的流失预警，用�?天没登录就触发召�?
短期优化�?个月内）�?- 试试企业版套餐，企业客户ARPU比个人高3倍，这块潜力�?- 内容营销可以搞起来，降低对付费流量的依赖
- 核心转化漏斗每个环节都看看，找出流失最大的节点

中长期布局�?个月内）�?- 二三线城市渗透率只有15%，增长空间很�?- 用户分层运营要做起来，不同用户给不同策略
- 数据看板再完善一下，让团队都能实时看到关键指�?
【预期效果�?如果上面这些都能落地，预�?个月内：
- 获客成本能降15-20%
- 7日留存提升到60%以上
- 整体转化率提升到4%左右

当然，具体还得看执行情况和资源投入。`;
  };

  const getTypeConfig = (type: string) => analysisTypes.find(t => t.value === type) || analysisTypes[0];
  const completedCount = analyses.filter(a => a.status === 'completed').length;
  const analysisRate = analyses.length > 0 ? Math.round((completedCount / analyses.length) * 100) : 0;

  // 获取状态颜色和图标
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success': return { color: '#52c41a', icon: <ArrowUpOutlined />, bg: isDarkMode ? '#23863630' : '#f6ffed' };
      case 'warning': return { color: '#faad14', icon: <MinusOutlined />, bg: isDarkMode ? '#9e6a0330' : '#fffbe6' };
      case 'error': return { color: '#ff4d4f', icon: <ArrowDownOutlined />, bg: isDarkMode ? '#da363330' : '#fff2f0' };
      default: return { color: '#8c8c8c', icon: <MinusOutlined />, bg: 'transparent' };
    }
  };

  return (
    <div style={{ background: isDarkMode ? '#0d1117' : 'var(--bg-page)', borderRadius: 16, overflow: 'hidden' }}>
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
          <Avatar size={44} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }} icon={<BarChartOutlined />} />
          <div style={{ marginLeft: 14 }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>数据分析诊断</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>深度诊断业务数据，发现增长机�?/div>
          </div>
        </div>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 12, 
              padding: '14px 8px', 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{analyses.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>分析总数</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 12, 
              padding: '14px 8px', 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{completedCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>已完�?/div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 12, 
              padding: '14px 8px', 
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{analysisRate}%</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>完成�?/div>
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
            label: <span><BulbOutlined /> 创建分析</span>,
            children: (
              <div style={{ padding: '20px 0' }}>
                {/* 分析类型选择 - 可视化卡�?*/}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 16, fontWeight: 600 }}>
                    <PieChartOutlined style={{ marginRight: 8 }} /> 选择分析类型
                  </div>
                  <Row gutter={[12, 12]}>
                    {analysisTypes.map(type => (
                      <Col span={8} key={type.value}>
                        <Card
                          hoverable
                          onClick={() => {
                            setSelectedType(type.value);
                            form.setFieldsValue({ analysisType: type.value });
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
                            icon={type.icon}
                          />
                          <div style={{ fontWeight: 600, fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 4 }}>
                            {type.label}
                          </div>
                          <div style={{ fontSize: 12, color: isDarkMode ? '#8b949e' : '#999' }}>
                            点击选择
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                <Divider style={{ borderColor: isDarkMode ? '#30363d' : undefined }} />

                {/* 业务阶段选择 - 步骤条样�?*/}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 16, fontWeight: 600 }}>
                    <DashboardOutlined style={{ marginRight: 8 }} /> 选择业务阶段
                  </div>
                  <Row gutter={[12, 12]}>
                    {businessStages.map((stage) => (
                      <Col span={8} key={stage.value}>
                        <Card
                          hoverable
                          onClick={() => {
                            setSelectedStage(stage.value);
                            form.setFieldsValue({ businessStage: stage.value });
                          }}
                          style={{
                            borderRadius: 12,
                            border: selectedStage === stage.value ? '2px solid #667eea' : (isDarkMode ? '1px solid #30363d' : '1px solid var(--border-light)'),
                            background: selectedStage === stage.value ? (isDarkMode ? '#1f6feb20' : '#f0f5ff') : (isDarkMode ? '#161b22' : '#fff'),
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                          styles={{ body: { padding: '16px' } }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              size={40} 
                              style={{ 
                                background: selectedStage === stage.value ? '#667eea' : (isDarkMode ? '#30363d' : '#f0f0f0'),
                                color: selectedStage === stage.value ? '#fff' : (isDarkMode ? '#8b949e' : '#666'),
                                fontSize: 18,
                              }}
                            >
                              {stage.icon}
                            </Avatar>
                            <div style={{ marginLeft: 12, flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 15, color: isDarkMode ? '#c9d1d9' : '#333' }}>
                                {stage.label}
                              </div>
                              <div style={{ fontSize: 12, color: isDarkMode ? '#8b949e' : '#999', marginTop: 2 }}>
                                {stage.description}
                              </div>
                            </div>
                            {selectedStage === stage.value && (
                              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                            )}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                <Divider style={{ borderColor: isDarkMode ? '#30363d' : undefined }} />

                {/* 指标数据可视�?*/}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: isDarkMode ? '#c9d1d9' : '#333', marginBottom: 16, fontWeight: 600 }}>
                    <LineChartOutlined style={{ marginRight: 8 }} /> 核心指标监控
                  </div>
                  <Row gutter={[12, 12]}>
                    {mockMetrics.map((metric, index) => {
                      const statusConfig = getStatusConfig(metric.status);
                      const percent = Math.min((metric.value / metric.target) * 100, 100);
                      return (
                        <Col span={8} key={index}>
                          <Card
                            style={{
                              borderRadius: 12,
                              border: isDarkMode ? '1px solid #30363d' : '1px solid var(--border-light)',
                              background: isDarkMode ? '#161b22' : '#fff',
                            }}
                            styles={{ body: { padding: '16px' } }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                              <Avatar 
                                size={36} 
                                style={{ 
                                  background: statusConfig.bg, 
                                  color: statusConfig.color,
                                  marginRight: 10,
                                }} 
                                icon={metric.icon}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, color: isDarkMode ? '#8b949e' : '#666' }}>{metric.name}</div>
                                <div style={{ fontSize: 20, fontWeight: 'bold', color: statusConfig.color }}>
                                  {metric.unit}{metric.value}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                {statusConfig.icon}
                                <div style={{ fontSize: 11, color: isDarkMode ? '#8b949e' : '#999', marginTop: 2 }}>
                                  目标: {metric.unit}{metric.target}
                                </div>
                              </div>
                            </div>
                            <Progress 
                              percent={percent} 
                              showInfo={false}
                              strokeColor={statusConfig.color}
                              railColor={isDarkMode ? '#30363d' : '#f0f0f0'}
                              size="small"
                            />
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>

                <Divider style={{ borderColor: isDarkMode ? '#30363d' : undefined }} />

                {/* 表单区域 */}
                <Form form={form} layout="vertical" size="middle">
                  <Form.Item name="title" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>分析标题</span>} rules={[{ required: true, message: '请输入分析标�? }]}>
                    <Input 
                      placeholder="例如：Q2业务全面诊断" 
                      prefix={<BarChartOutlined />} 
                      style={{ 
                        borderRadius: 10,
                        background: isDarkMode ? '#161b22' : undefined,
                        borderColor: isDarkMode ? '#30363d' : undefined,
                        color: isDarkMode ? '#c9d1d9' : undefined,
                      }} 
                      size="large" 
                    />
                  </Form.Item>
                  
                  {/* 隐藏的分析类型和业务阶段字段 */}
                  <Form.Item name="analysisType" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name="businessStage" hidden>
                    <Input />
                  </Form.Item>
                  
                  {/* 显示已选择的类型和阶段 */}
                  <div style={{ marginBottom: 16, padding: '12px 16px', background: isDarkMode ? '#161b22' : 'var(--bg-page)', borderRadius: 10, border: isDarkMode ? '1px solid #30363d' : '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 13, color: isDarkMode ? '#8b949e' : '#666', marginBottom: 8 }}>已选择</div>
                    <Space>
                      {selectedType && (
                        <Tag color={getTypeConfig(selectedType).color} style={{ borderRadius: 6, padding: '4px 12px' }}>
                          {getTypeConfig(selectedType).icon} {getTypeConfig(selectedType).label}
                        </Tag>
                      )}
                      {selectedStage && (
                        <Tag style={{ borderRadius: 6, padding: '4px 12px', background: isDarkMode ? '#21262d' : '#f0f0f0', border: 'none' }}>
                          {businessStages.find(s => s.value === selectedStage)?.icon} {businessStages.find(s => s.value === selectedStage)?.label}
                        </Tag>
                      )}
                      {(!selectedType || !selectedStage) && (
                        <span style={{ color: isDarkMode ? '#8b949e' : '#999', fontSize: 13 }}>请在上方选择分析类型和业务阶�?/span>
                      )}
                    </Space>
                  </div>
                  <Form.Item name="metrics" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>关键指标数据</span>}>
                    <TextArea 
                      placeholder="描述当前的核心业务指标数据，如用户量、留存率、转化率�?.." 
                      rows={3} 
                      style={{ 
                        borderRadius: 10,
                        background: isDarkMode ? '#161b22' : undefined,
                        borderColor: isDarkMode ? '#30363d' : undefined,
                        color: isDarkMode ? '#c9d1d9' : undefined,
                      }} 
                    />
                  </Form.Item>
                  <Form.Item name="description" label={<span style={{ color: isDarkMode ? '#c9d1d9' : undefined }}>补充说明</span>}>
                    <TextArea 
                      placeholder="描述当前面临的业务挑战或关注的重�?.." 
                      rows={2} 
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
                      生成分析报告
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ),
          },
          {
            key: 'result',
            label: <span><RiseOutlined /> 分析结果</span>,
            children: (
              <Spin spinning={loading}>
                {result ? (
                  <div style={{ marginTop: 20, padding: '0 0 20px' }}>
                    {/* 结果概览卡片 */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                      <Col span={8}>
                        <Card style={{ borderRadius: 12, background: isDarkMode ? '#161b22' : '#f6ffed', border: isDarkMode ? '1px solid #30363d' : '1px solid #b7eb8f' }}>
                          <Statistic
                            title={<span style={{ color: isDarkMode ? '#8b949e' : '#666' }}>优势指标</span>}
                            value={2}
                            suffix="�?
                            styles={{ content: {} }}
                            prefix={<TrophyOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{ borderRadius: 12, background: isDarkMode ? '#161b22' : '#fff2f0', border: isDarkMode ? '1px solid #30363d' : '1px solid #ffa39e' }}>
                          <Statistic
                            title={<span style={{ color: isDarkMode ? '#8b949e' : '#666' }}>风险预警</span>}
                            value={3}
                            suffix="�?
                            styles={{ content: {} }}
                            prefix={<AlertOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{ borderRadius: 12, background: isDarkMode ? '#161b22' : '#e6f4ff', border: isDarkMode ? '1px solid #30363d' : '1px solid #91caff' }}>
                          <Statistic
                            title={<span style={{ color: isDarkMode ? '#8b949e' : '#666' }}>优化建议</span>}
                            value={6}
                            suffix="�?
                            styles={{ content: {} }}
                            prefix={<BulbOutlined />}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* 分析漏斗�?*/}
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
                        <BarChartOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                        转化漏斗分析
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <FunnelChart
                          data={[
                            { label: '曝光', value: 50000, color: '#a855f7', conversion: 100 },
                            { label: '点击', value: 12500, color: '#d946ef', conversion: 25 },
                            { label: '访问', value: 6250, color: '#f472b6', conversion: 50 },
                            { label: '注册', value: 1875, color: '#c084fc', conversion: 30 },
                            { label: '付费', value: 375, color: '#8b5cf6', conversion: 20 },
                          ]}
                          width={680}
                          height={340}
                        />
                      </div>
                    </Card>

                    {/* 问题诊断思维导图 */}
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
                        <PieChartOutlined style={{ marginRight: 8, color: '#d946ef' }} />
                        问题诊断图谱
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <MindMap
                          data={{
                            id: 'root',
                            label: '业务诊断',
                            color: '#ef4444',
                            children: [
                              {
                                id: 'user',
                                label: '用户问题',
                                color: '#f97316',
                                children: [
                                  { id: 'acq', label: '获客成本�?, color: '#fbbf24' },
                                  { id: 'ret', label: '留存率低', color: '#fbbf24' },
                                ],
                              },
                              {
                                id: 'product',
                                label: '产品问题',
                                color: '#a855f7',
                                children: [
                                  { id: 'conv', label: '转化率低', color: '#c084fc' },
                                  { id: 'ltv', label: 'LTV偏低', color: '#c084fc' },
                                ],
                              },
                              {
                                id: 'market',
                                label: '市场问题',
                                color: '#3b82f6',
                                children: [
                                  { id: 'comp', label: '竞品威胁', color: '#60a5fa' },
                                  { id: 'share', label: '份额下降', color: '#60a5fa' },
                                ],
                              },
                            ],
                          }}
                          width={680}
                          height={380}
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
                              title: savedValues.title || '数据分析诊断',
                              type: 'analysis',
                              typeLabel: '数据分析',
                              content: result,
                            });
                          }}
                          style={{ borderRadius: 10, height: 44 }}
                        >保存报告</Button>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <Empty 
                    description={<span style={{ color: isDarkMode ? '#8b949e' : undefined }}>请先创建分析</span>} 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    style={{ marginTop: 40 }} 
                  />
                )}
              </Spin>
            ),
          },
          {
            key: 'library',
            label: <span><CheckCircleOutlined /> 报告�?/span>,
            children: (
              <div style={{ padding: '20px 0' }}>
                {analyses.map((item) => { 
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
                            <Badge status={item.status === 'completed' ? 'success' : 'processing'} text={item.status === 'completed' ? '已完�? : '草稿'} style={{ fontSize: 12 }} />
                            <span style={{ fontSize: 12, color: isDarkMode ? '#8b949e' : '#999' }}><ClockCircleOutlined style={{ marginRight: 4 }} />{item.createTime}</span>
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

export default DataAnalysisPanel;
