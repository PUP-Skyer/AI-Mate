/**
 * 内容生成面板 - 工匠 Maker 功能组件
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Empty, Spin, Space, Tabs, Row, Col, Avatar, Divider, Badge, Statistic } from 'antd';
import { EditOutlined, SendOutlined, RocketOutlined, CheckCircleOutlined, BulbOutlined, FileTextOutlined, CopyOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const contentTypes = [
  { value: 'article', label: '文章创作', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '📝' },
  { value: 'social', label: '社交媒体', color: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '📱' },
  { value: 'ad', label: '广告文案', color: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '📢' },
  { value: 'email', label: '邮件营销', color: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '✉️' },
  { value: 'script', label: '视频脚本', color: '#fa709a', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '🎬' },
  { value: 'product', label: '产品描述', color: '#ff6a00', gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)', icon: '📦' },
];

const writingStyles = [
  { value: 'professional', label: '专业严谨', icon: '👔' },
  { value: 'casual', label: '轻松活泼', icon: '😄' },
  { value: 'persuasive', label: '说服力强', icon: '💪' },
  { value: 'emotional', label: '情感共鸣', icon: '❤️' },
  { value: 'storytelling', label: '故事叙述', icon: '📖' },
];

interface Content {
  id: string;
  title: string;
  type: string;
  style: string;
  status: 'draft' | 'completed';
  createTime: string;
  content: string;
}

const ContentGenerationPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [contents, setContents] = useState<Content[]>([
    {
      id: 'CG001',
      title: '产品发布推文',
      type: 'social',
      style: 'casual',
      status: 'completed',
      createTime: '2026-04-20',
      content: '🚀 我们来了！全新AI助手正式上线，让工作效率提升300%...',
    },
    {
      id: 'CG002',
      title: '行业洞察文章',
      type: 'article',
      style: 'professional',
      status: 'completed',
      createTime: '2026-04-22',
      content: '在数字化转型的浪潮中，企业如何把握AI带来的机遇？本文深入分析...',
    },
  ]);

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const generatedContent = generateContent(values);
      setResult(generatedContent);
      const newContent: Content = {
        id: `CG${Date.now()}`,
        title: values.title,
        type: values.contentType,
        style: values.writingStyle,
        status: 'completed',
        createTime: new Date().toISOString().split('T')[0],
        content: generatedContent,
      };
      setContents((prev) => [newContent, ...prev]);
      setActiveTab('result');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = (values: any) => {
    const typeLabel = contentTypes.find(t => t.value === values.contentType)?.label || '';
    const styleLabel = writingStyles.find(s => s.value === values.writingStyle)?.label || '';
    return `## ${values.title}

**类型**：${typeLabel} | **风格**：${styleLabel}

---

${values.contentType === 'article' ? `# ${values.title}

## 引言
${values.description || '在这个快速发展的时代，我们面临着前所未有的机遇与挑战。'}

## 核心观点

### 1. 现状分析
当前市场环境下，数字化转型已成为企业发展的必由之路。根据最新研究数据，超过70%的企业已经将AI技术纳入战略规划。

### 2. 关键趋势
- **智能化升级**：从自动化到智能化
- **数据驱动决策**：从经验判断到数据支撑
- **用户体验至上**：从功能导向到体验导向

### 3. 实践建议
1. 制定清晰的数字化战略
2. 建立数据治理体系
3. 培养数字化人才队伍
4. 持续优化用户体验

## 结语
数字化转型不是一蹴而就的过程，而是需要持续投入和优化的长期工程。只有拥抱变化，才能在竞争中保持领先。` :
    values.contentType === 'social' ? `🚀 ${values.title}

${values.description || '全新产品上线！'}

✨ 核心亮点：
✅ 智能高效 - 效率提升300%
✅ 简单易用 - 3分钟上手
✅ 安全可靠 - 企业级安全标准

🎁 限时福利：
前100名注册用户享首月免费！

👉 立即体验：[链接]

#数字化转型 #AI助手 #效率提升` :
    values.contentType === 'ad' ? `🔥 ${values.title}

🎯 痛点直击：还在为${values.description || '工作效率低下'}而烦恼？

💡 解决方案：${values.title}为您带来全新体验！

📊 效果展示：
- 效率提升 300%
- 成本降低 50%
- 用户满意度 98%

🔥 限时特惠：立即行动，享受专属折扣！

👆 扫码了解更多` :
    values.contentType === 'email' ? `主题：${values.title}

尊敬的${values.target || '用户'}：

您好！

${values.description || '我们很高兴向您介绍我们的最新产品功能。'}

主要更新：
1. 全新界面设计，使用更便捷
2. 新增智能推荐功能
3. 性能优化，加载速度提升50%

如有任何问题，欢迎随时联系我们。

祝好！
${values.sender || '产品团队'}` :
    `## ${values.title}

### 场景描述
${values.description || '一个关于创新与突破的故事'}

### 脚本正文
[开场]
（画面：...）
旁白：...

[发展]
（画面：...）
对话：...

[高潮]
（画面：...）
旁白：...

[结尾]
（画面：...）
字幕：...`
}`;
  };

  const getTypeConfig = (type: string) => contentTypes.find(t => t.value === type) || contentTypes[0];
  const getStyleConfig = (style: string) => writingStyles.find(s => s.value === style) || writingStyles[0];
  const completedCount = contents.filter(c => c.status === 'completed').length;
  const completionRate = contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

  return (
    <div style={{ background: '#f8f9fa', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<EditOutlined />} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>内容生成</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>AI驱动的内容创作，一键生成高质量文案</div>
          </div>
        </div>
        <Row gutter={12}>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{contents.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>内容总数</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completedCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>已完成</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{completionRate}%</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>完成率</div>
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 'bold' }}>
          <FileTextOutlined /> 内容类型
        </div>
        <Space wrap>
          {contentTypes.map(type => (
            <Tag key={type.value} color={type.color} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 13, borderRadius: 16, border: 'none' }} onClick={() => form.setFieldsValue({ contentType: type.value })}>
              <span style={{ marginRight: 4 }}>{type.icon}</span>{type.label}
            </Tag>
          ))}
        </Space>
      </div>

      <Divider style={{ margin: 0 }} />

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ padding: '0 16px' }} items={[
        {
          key: 'create',
          label: <span><BulbOutlined /> 创建内容</span>,
          children: (
            <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
              <Form.Item name="title" label="内容标题" rules={[{ required: true, message: '请输入内容标题' }]}>
                <Input placeholder="例如：产品发布推文" prefix={<EditOutlined />} style={{ borderRadius: 8 }} size="large" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="contentType" label="内容类型" rules={[{ required: true }]}>
                    <Select placeholder="选择类型" style={{ borderRadius: 8 }} size="large">
                      {contentTypes.map(t => <Select.Option key={t.value} value={t.value}><span style={{ marginRight: 8 }}>{t.icon}</span>{t.label}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="writingStyle" label="写作风格" rules={[{ required: true }]}>
                    <Select placeholder="选择风格" style={{ borderRadius: 8 }} size="large">
                      {writingStyles.map(s => <Select.Option key={s.value} value={s.value}><span style={{ marginRight: 8 }}>{s.icon}</span>{s.label}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="wordCount" label="字数要求">
                    <Input placeholder="例如：500字" style={{ borderRadius: 8 }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}><Form.Item name="target" label="目标受众"><Input placeholder="例如：25-35岁职场人群" style={{ borderRadius: 8 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="tone" label="语气要求"><Input placeholder="例如：专业、幽默" style={{ borderRadius: 8 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="keywords" label="关键词"><Input placeholder="用逗号分隔" style={{ borderRadius: 8 }} /></Form.Item></Col>
              </Row>
              <Form.Item name="description" label="内容描述">
                <TextArea placeholder="描述内容主题、核心要点、背景信息等..." rows={3} style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SendOutlined />} onClick={handleGenerate} loading={loading} block size="large" style={{ borderRadius: 8, height: 44, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                  生成内容
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
                  <Card style={{ padding: 20, background: '#f0f5ff', border: '1px solid #d6e4ff', borderRadius: 12, marginBottom: 16, whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14 }}>
                    {result}
                  </Card>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button onClick={() => setActiveTab('create')} block style={{ borderRadius: 8, height: 40 }}>重新生成</Button>
                    </Col>
                    <Col span={12}>
                      <Button type="primary" icon={<CopyOutlined />} block style={{ borderRadius: 8, height: 40 }}>复制内容</Button>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Empty description="请先创建内容" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
              )}
            </Spin>
          ),
        },
        {
          key: 'library',
          label: <span><CheckCircleOutlined /> 内容库</span>,
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{contents.map((item) => { const typeConfig = getTypeConfig(item.type);
              const styleConfig = getStyleConfig(item.style);
              return (
                <Card size="small" hoverable style={{ marginBottom: 12, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} styles={{ body: { padding: '16px' } }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Avatar size={40} style={{ background: typeConfig.gradient, flexShrink: 0 }}>{typeConfig.icon}</Avatar>
                    <div style={{ marginLeft: 12, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>{item.title}</div>
                      <Space size={8}>
                        <Tag color={typeConfig.color} style={{ borderRadius: 4 }}>{typeConfig.icon} {typeConfig.label}</Tag>
                        <Tag style={{ borderRadius: 4 }}>{styleConfig.icon} {styleConfig.label}</Tag>
                        <Badge status={item.status === 'completed' ? 'success' : 'processing'} text={item.status === 'completed' ? '已完成' : '草稿'} style={{ fontSize: 12 }} />
                      </Space>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: '#f8f9fa', padding: 12, borderRadius: 8, lineHeight: 1.6 }}>
                    {item.content.substring(0, 100)}...
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{item.createTime}</div>
                </Card>
              ); })}
            </div>
          ),
        },
      ]} />
    </div>
  );
};

export default ContentGenerationPanel;
