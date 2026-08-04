/**
 * 创业规划面板 - 军师AI Sage 功能组件
 * 超级个体创业全流程规划工具
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Empty, Spin, Space, Tabs, Row, Col, Avatar, Divider, Badge, Steps, message, Typography } from 'antd';
import { BulbOutlined, RocketOutlined, TeamOutlined, DollarOutlined, AimOutlined, CheckCircleOutlined, BookOutlined, ClockCircleOutlined, FileTextOutlined, SaveOutlined, ThunderboltOutlined, FundOutlined, LineChartOutlined, ApartmentOutlined } from '@ant-design/icons';
import { saveReport } from '../../utils/reportStorage';

const { TextArea } = Input;
const { Text } = Typography;

const projectTypes = [
  { value: 'digital_product', label: '数字产品', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '💻', desc: 'SaaS / App / 工具类' },
  { value: 'content_creation', label: '内容创作', color: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '✍️', desc: '自媒体 / 知识付费' },
  { value: 'ecommerce', label: '电商零售', color: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🛒', desc: '线上店铺 / DTC品牌' },
  { value: 'service', label: '专业服务', color: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '🎯', desc: '咨询 / 设计 / 开发' },
  { value: 'community', label: '社群运营', color: '#fa709a', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '👥', desc: '付费社群 / 会员制' },
  { value: 'ai_venture', label: 'AI创业', color: '#ff6a00', gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)', icon: '🤖', desc: 'AI Agent / AI应用' },
];

const businessStages = [
  { value: 'idea', label: '创意阶段', icon: '💡', description: '验证想法，明确方向' },
  { value: 'mvp', label: 'MVP阶段', icon: '🔧', description: '最小可行产品，快速试错' },
  { value: 'launch', label: '启动阶段', icon: '🚀', description: '正式发布，获取首批用户' },
  { value: 'growth', label: '增长阶段', icon: '📈', description: '规模化获客，收入增长' },
  { value: 'scale', label: '规模阶段', icon: '🏢', description: '团队扩张，流程标准化' },
];

const planTemplates = [
  { value: 'lean', label: '精益创业画布', icon: '📋', color: '#667eea' },
  { value: 'full', label: '完整商业计划书', icon: '📄', color: '#43e97b' },
  { value: 'pitch', label: '融资路演方案', icon: '🎤', color: '#f093fb' },
  { value: 'roadmap', label: '产品路线图', icon: '🗺️', color: '#4facfe' },
];

interface PlanSection {
  title: string;
  icon: React.ReactNode;
  key: string;
  content: string;
}

const EntrepreneurshipPlanning: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [planSections, setPlanSections] = useState<PlanSection[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedValues, setSavedValues] = useState<Record<string, unknown>>({});

  const businessPlanSteps = [
    { title: '项目定位', description: '明确方向与赛道' },
    { title: '市场分析', description: '洞察市场与竞争' },
    { title: '商业模式', description: '设计收入模型' },
    { title: '执行路线', description: '制定行动计划' },
    { title: '财务预测', description: '投入产出测算' },
  ];

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setSavedValues(values);
    setLoading(true);
    setCurrentStep(0);

    const typeInfo = projectTypes.find((t) => t.value === values.projectType) || projectTypes[0];
    const stageInfo = businessStages.find((s) => s.value === values.stage) || businessStages[0];
    const templateInfo = planTemplates.find((t) => t.value === values.template) || planTemplates[0];

    const generatedContent = `## 🎯 ${values.projectName || '创业项目规划方案'}

### 📌 基本信息
- **项目类型**: ${typeInfo.icon} ${typeInfo.label} - ${typeInfo.desc}
- **当前阶段**: ${stageInfo.icon} ${stageInfo.label} - ${stageInfo.description}
- **模板类型**: ${templateInfo.icon} ${templateInfo.label}
${values.targetAudience ? `- **目标用户**: ${values.targetAudience}` : ''}
${values.budget ? `- **启动预算**: ¥${values.budget}` : ''}

### 🔍 一句话定位
${values.pitch || '（请在下方输入您的项目一句话定位）'}

---

### 📊 市场分析
本项目属于 **${typeInfo.label}** 赛道，当前市场趋势呈现以下特征：
1. 用户需求持续增长，数字化渗透率逐年提升
2. 头部玩家占据市场份额 60%+，但细分领域仍有大量机会
3. AI 技术赋能正在重塑行业格局

**目标用户画像**：${values.targetAudience || '请明确您的目标用户群体'}
**市场规模预估**：基于 ${typeInfo.label} 行业的增长率，初创阶段可瞄准 ¥100-500 万细分市场

---

### 💰 商业模式设计
**收入模型**：
| 收入来源 | 预计占比 | 说明 |
|----------|----------|------|
| 主营业务收入 | 60% | 核心产品/服务收费 |
| 增值服务 | 25% | 高级功能/定制服务 |
| 其他收入 | 15% | 广告/联盟/衍生品 |

**定价策略**：建议采用「基础免费 + 高级付费」的 Freemium 模式，降低获客门槛。

---

### 🗺️ 执行路线图
| 阶段 | 时间 | 关键任务 | 里程碑 |
|------|------|----------|--------|
| ${stageInfo.icon} ${stageInfo.label} | 第1-3月 | 产品验证与种子用户获取 | 获得首批100名用户 |
| 📈 增长 | 第4-6月 | 产品迭代与渠道建设 | 月营收突破5万 |
| 🏢 规模 | 第7-12月 | 团队搭建与标准化 | 月营收突破20万 |

---

### 💸 财务预测
| 项目 | 第1月 | 第3月 | 第6月 | 第12月 |
|------|-------|-------|-------|--------|
| 预计收入 | ¥0 | ¥15,000 | ¥60,000 | ¥200,000 |
| 运营成本 | ¥5,000 | ¥8,000 | ¥20,000 | ¥60,000 |
| 净利润 | -¥5,000 | ¥7,000 | ¥40,000 | ¥140,000 |

**启动资金需求**：${values.budget ? `¥${values.budget}` : '¥50,000 - 100,000'}
**预估回本周期**：3-6 个月

---

### ⚡ 青宸智汇 军师建议
1. **聚焦细分**：在 ${typeInfo.label} 赛道中找一个足够小的切入口，做到细分第一
2. **快速验证**：2周内推出 MVP，用真实用户反馈指导迭代
3. **内容引流**：针对 ${values.targetAudience || '目标用户'} 持续输出高质量内容
4. **数据驱动**：从第1天开始建立数据追踪体系

---

> 💡 *本规划由 青宸智汇 军师AI 自动生成，建议结合实际情况调整执行。创业之路，你我同行！*`;

    setResult(generatedContent);

    setPlanSections([
      { title: '项目定位', icon: <AimOutlined />, key: 'positioning', content: `## 项目定位\n**赛道**: ${typeInfo.icon} ${typeInfo.label}\n**阶段**: ${stageInfo.label}\n**目标用户**: ${values.targetAudience || '待定义'}\n**核心价值**: ${values.pitch || '待定义'}` },
      { title: '市场分析', icon: <FundOutlined />, key: 'market', content: `## 市场分析\n**行业**: ${typeInfo.label}\n**趋势**: 数字化转型加速，AI赋能重塑格局\n**机会**: 细分市场存在大量蓝海机会` },
      { title: '商业模式', icon: <DollarOutlined />, key: 'business', content: `## 商业模式\n**收入模型**: Freemium + 增值服务\n**定价**: 基础免费，高级付费\n**预算**: ¥${values.budget || '待定'}` },
      { title: '执行路线', icon: <RocketOutlined />, key: 'roadmap', content: `## 执行路线\n**0-3月**: 产品验证\n**4-6月**: 增长获客\n**7-12月**: 规模化` },
      { title: '财务预测', icon: <LineChartOutlined />, key: 'finance', content: `## 财务预测\n**启动资金**: ¥${values.budget || '5-10万'}\n**回本周期**: 3-6个月\n**12月目标营收**: ¥20万+` },
    ]);

    setTimeout(() => setCurrentStep(1), 600);
    setTimeout(() => setCurrentStep(2), 1200);
    setTimeout(() => setCurrentStep(3), 1800);
    setTimeout(() => setCurrentStep(4), 2400);

    setLoading(false);
  };

  const handleSave = () => {
    if (result) {
      const projectName = savedValues.projectName || '创业规划';
      saveReport(`创业规划_${projectName}_${new Date().toISOString().slice(0, 10)}`, result);
      message.success('创业规划已保存到本地！');
    }
  };

  const typeInfo = projectTypes.find((t) => t.value === savedValues.projectType) || projectTypes[0];
  const stageInfo = businessStages.find((s) => s.value === savedValues.stage) || businessStages[0];

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<RocketOutlined />} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>创业规划</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>从创意到落地，一站式创业规划 · 支持多模板</div>
          </div>
        </div>
        <Row gutter={12}>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{projectTypes.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>项目类型</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{businessStages.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>创业阶段</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{planTemplates.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>规划模板</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>AI</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>智能生成</div>
            </div>
          </Col>
        </Row>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ padding: '0 16px' }}
        items={[
          {
            key: 'create',
            label: <span><BulbOutlined /> 创建规划</span>,
            children: (
              <div style={{ padding: '8px 0' }}>
                <Form form={form} layout="vertical" size="middle">
                  <Form.Item name="template" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}><FileTextOutlined style={{ marginRight: 4 }} />规划模板</span>} initialValue="lean">
                    <Select size="large" style={{ borderRadius: 8 }}>
                      {planTemplates.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                          <Space>
                            <span>{opt.icon}</span>
                            <span style={{ color: opt.color, fontWeight: 500 }}>{opt.label}</span>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="projectName" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}><RocketOutlined style={{ marginRight: 4 }} />项目名称</span>} rules={[{ required: true, message: '请输入项目名称' }]}>
                    <Input placeholder="给你的创业项目起个名字..." size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>

                  <Form.Item name="pitch" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}><AimOutlined style={{ marginRight: 4 }} />一句话定位</span>} rules={[{ required: true, message: '请输入项目一句话定位' }]}>
                    <TextArea placeholder="用一句话说清你的项目是什么、为谁解决什么问题..." rows={2} style={{ borderRadius: 8 }} />
                  </Form.Item>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="projectType" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}><ApartmentOutlined style={{ marginRight: 4 }} />项目类型</span>} initialValue="digital_product">
                        <Select size="large" style={{ borderRadius: 8 }}>
                          {projectTypes.map((opt) => (
                            <Select.Option key={opt.value} value={opt.value}>
                              <Space>
                                <span>{opt.icon}</span>
                                <span style={{ color: opt.color, fontWeight: 500 }}>{opt.label}</span>
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="stage" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}><ClockCircleOutlined style={{ marginRight: 4 }} />当前阶段</span>} initialValue="idea">
                        <Select size="large" style={{ borderRadius: 8 }}>
                          {businessStages.map((opt) => (
                            <Select.Option key={opt.value} value={opt.value}>
                              <Space>
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="targetAudience" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}><TeamOutlined style={{ marginRight: 4 }} />目标用户</span>}>
                        <Input placeholder="描述你的目标用户画像..." size="large" style={{ borderRadius: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="budget" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}><DollarOutlined style={{ marginRight: 4 }} />启动预算(¥)</span>}>
                        <Input placeholder="50000" size="large" style={{ borderRadius: 8 }} type="number" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={handleGenerate}
                      loading={loading}
                      block
                      size="large"
                      style={{
                        borderRadius: 8,
                        height: 48,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      生成创业规划方案
                    </Button>
                  </Form.Item>
                </Form>

                {!result && (
                  <Card style={{ borderRadius: 12, border: '1px dashed var(--border-light)', background: 'var(--bg-card)', textAlign: 'center', padding: '40px 0' }}>
                    <RocketOutlined style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }} />
                    <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>填写项目信息，一键生成专业规划</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>支持精益画布、商业计划书、路演方案等多种模板</div>
                  </Card>
                )}
              </div>
            ),
          },
          {
            key: 'preview',
            label: <span><FileTextOutlined /> 方案预览</span>,
            children: (
              <Spin spinning={loading}>
                {!result ? (
                  <Empty description="请先在「创建规划」中生成方案" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Steps
                        current={currentStep}
                        size="small"
                        style={{ flex: 1 }}
                        items={businessPlanSteps.map((s) => ({ title: s.title }))}
                      />
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        size="middle"
                        style={{
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          border: 'none',
                          marginLeft: 12,
                          flexShrink: 0,
                        }}
                      >
                        保存方案
                      </Button>
                    </div>

                    <Card
                      title={
                        <Space>
                          {typeInfo.icon}
                          <span>{savedValues.projectName || '创业项目'}</span>
                          <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                          <Tag color={stageInfo.icon === '💡' ? 'blue' : stageInfo.icon === '🔧' ? 'orange' : stageInfo.icon === '🚀' ? 'green' : stageInfo.icon === '📈' ? 'purple' : 'red'}>
                            {stageInfo.icon} {stageInfo.label}
                          </Tag>
                        </Space>
                      }
                      style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}
                    >
                      {planSections.map((section, index) => (
                        <Card
                          key={section.key}
                          size="small"
                          title={
                            <Space>
                              <Avatar size={24} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} icon={section.icon} />
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title}</span>
                              {index <= currentStep && <Badge status="success" />}
                            </Space>
                          }
                          style={{
                            borderRadius: 10,
                            border: index <= currentStep ? '1px solid #52c41a' : '1px solid var(--border-light)',
                            marginBottom: 12,
                            opacity: index <= currentStep ? 1 : 0.5,
                          }}
                        >
                          {index <= currentStep ? (
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                              {section.content}
                            </pre>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>正在生成中...</div>
                          )}
                        </Card>
                      ))}
                    </Card>

                    <Divider />

                    <Card
                      title={<span><ThunderboltOutlined style={{ marginRight: 8 }} />完整规划文档</span>}
                      style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body, "Fira Sans", system-ui)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, background: 'var(--bg-page)', padding: 16, borderRadius: 8, margin: 0 }}>
                        {result}
                      </pre>
                    </Card>
                  </div>
                )}
              </Spin>
            ),
          },
          {
            key: 'history',
            label: <span><BookOutlined /> 历史规划</span>,
            children: (
              <div style={{ padding: '8px 0', textAlign: 'center', paddingTop: 40 }}>
                <BookOutlined style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>历史规划记录</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>使用「保存方案」按钮可将规划保存至本地</div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default EntrepreneurshipPlanning;
