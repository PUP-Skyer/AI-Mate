/**
 * 工匠AI (MakerAI) - 超级个体创业技能库
 * 九大创业方向快捷功能
 */

import React, { useState } from 'react';
import {
  ToolOutlined,
  CloseOutlined,
  MessageOutlined,
  BookOutlined,
  FileTextOutlined,
  CodeOutlined,
  VideoCameraOutlined,
  EditOutlined,
  ShoppingOutlined,
  CarOutlined,
  TranslationOutlined,
  AppstoreOutlined,
  RightOutlined,
  StarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { Button, Card, Row, Col, Tag, Badge, Input, Modal, Typography, Divider, Alert, Space } from 'antd';
import ChatLayout from '../components/ChatLayout';
import WorkBoard from '../components/maker/WorkBoard';
import PrototypeDemoPanel from '../components/maker/PrototypeDemoPanel';
import { chatWithZhipuStream } from '../services/aiService';

const { Title, Text, Paragraph } = Typography;

// 九大创业方向数据
const businessCategories = [
  {
    key: 'consulting',
    title: '专业咨询 / 顾问服务',
    subtitle: '高客单、强专业',
    icon: <MessageOutlined />,
    color: '#a855f7',
    description: '靠行业经验、专业资质、实战能力收费，单人就能做，适合资深人士',
    items: [
      { name: '商业/管理咨询', examples: ['品牌定位', '营销策划', '电商运营', '跨境咨询', '小微企业管理'] },
      { name: '职场/职业咨询', examples: ['简历优化', '面试辅导', '转行规划', '职场晋升', '行业内推'] },
      { name: '专业领域咨询', examples: ['财税合规', '法务(非诉)', '心理疏导', '留学规划', '健康管理', 'IT架构/技术方案'] },
      { name: '垂直行业咨询', examples: ['餐饮开店', '医美运营', '教培机构运营', '短视频IP打造'] },
    ],
    hot: true,
  },
  {
    key: 'education',
    title: '知识付费 & 教育培训',
    subtitle: '可复利、一次做多卖',
    icon: <BookOutlined />,
    color: '#d946ef',
    description: '把经验、技能做成标准化内容，边际成本低',
    items: [
      { name: '录播课/训练营', examples: ['技能课(PS/PR/编程/Excel/剪辑/AI工具)', '行业课', '考证辅导', '兴趣课'] },
      { name: '付费社群/知识星球', examples: ['垂直领域干货', '资源', '问答', '人脉', '打卡监督'] },
      { name: '电子书/手册/报告', examples: ['行业指南', '实操手册', '解题攻略', '数据报告', '模板合集'] },
      { name: '直播带教/小班课', examples: ['小范围', '高互动', '高客单的技能带教'] },
    ],
    hot: true,
  },
  {
    key: 'digital',
    title: '数字产品 & 工具开发',
    subtitle: '纯线上、零库存、被动收入',
    icon: <CodeOutlined />,
    color: '#3b82f6',
    description: '适合懂设计、技术、产品思维的人，一次开发长期卖',
    items: [
      { name: '模板类', examples: ['PPT/Excel/Notion/简历/海报/电商详情模板', '文案脚本模板'] },
      { name: '插件/工具', examples: ['浏览器插件', '桌面小工具', 'AI辅助工具', '数据爬虫', '自动化脚本'] },
      { name: '小程序/轻应用', examples: ['小众工具类', '效率类', '垂直查询类小程序'] },
      { name: '数字素材', examples: ['壁纸', '字体', '插画', '音效', '视频素材', '预设滤镜', '摄影LR预设'] },
    ],
    hot: false,
  },
  {
    key: 'content',
    title: '内容创作 & IP自媒体',
    subtitle: '流量变现、品牌溢价',
    icon: <VideoCameraOutlined />,
    color: '#f59e0b',
    description: '靠垂直内容吸粉，广告、带货、商单、自有产品变现',
    items: [
      { name: '图文', examples: ['公众号', '知乎', '小红书', '豆瓣', '垂直博客'] },
      { name: '短视频/中长视频', examples: ['抖音', 'B站', '视频号(知识/测评/教程/生活/剧情/探店)'] },
      { name: '播客/音频', examples: ['垂直领域电台', '有声书', '知识解读'] },
      { name: '文案/剧本/网文', examples: ['商业文案', '品牌软文', '短视频脚本', '短剧剧本', '网络小说'] },
    ],
    hot: true,
  },
  {
    key: 'design',
    title: '设计 / 创意 / 视觉类服务',
    subtitle: '技能型、接单稳定',
    icon: <EditOutlined />,
    color: '#10b981',
    description: '纯脑力+软件，单人全流程可做',
    items: [
      { name: '平面设计', examples: ['LOGO', 'VI', '海报', '包装', '画册', '电商详情', '新媒体配图'] },
      { name: 'UI/UX设计', examples: ['APP界面', '小程序', '网页', 'H5'] },
      { name: '影像类', examples: ['摄影', '修图', '短视频剪辑', '特效', '字幕', '宣传片剪辑'] },
      { name: '3D/插画', examples: ['插画', '表情包', '3D建模', '渲染', '产品效果图'] },
    ],
    hot: false,
  },
  {
    key: 'tech',
    title: '技术开发 & 外包服务',
    subtitle: 'IT/技术向',
    icon: <CodeOutlined />,
    color: '#6366f1',
    description: '适合程序员、技术人，接单/项目制/维护收费',
    items: [
      { name: '前端/后端开发', examples: ['企业官网', '小程序', '简单后台', 'H5活动页'] },
      { name: '网站搭建/SEO', examples: ['WordPress建站', '外贸独立站', 'SEO优化', '内容维护'] },
      { name: '系统维护/技术支持', examples: ['小企业IT支持', '服务器运维', '数据处理', '爬虫服务'] },
      { name: '软件定制/二次开发', examples: ['小工具', '插件', '低代码定制', '模板修改'] },
    ],
    hot: false,
  },
  {
    key: 'ecommerce',
    title: '轻电商 & 贸易',
    subtitle: '无货源/细分/定制，轻资产',
    icon: <ShoppingOutlined />,
    color: '#ec4899',
    description: '不囤货、不重物流，一人管选品+运营+客服',
    items: [
      { name: '无货源电商', examples: ['一件代发', '跨境虾皮/亚马逊FBA', '小众垂直品类'] },
      { name: '定制/文创周边', examples: ['个性化T恤', '文创', '饰品', '数码周边(代印/代发)'] },
      { name: '数字藏品/虚拟商品', examples: ['虚拟壁纸', '数字手办', '线上课程', '会员权限'] },
      { name: '垂直小众电商', examples: ['细分兴趣', '专业耗材', '二手优品', '进口小众好物'] },
    ],
    hot: false,
  },
  {
    key: 'local',
    title: '本地生活 & 线下轻服务',
    subtitle: '同城、小范围',
    icon: <CarOutlined />,
    color: '#14b8a6',
    description: '适合不想纯线上、想做同城生意的人',
    items: [
      { name: '同城策划', examples: ['活动策划', '婚礼/派对小策划', '门店开业策划'] },
      { name: '家政/整理', examples: ['收纳整理', '家庭保洁', '宠物上门喂养/洗护'] },
      { name: '摄影/跟拍', examples: ['同城约拍', '婚礼跟拍', '活动记录'] },
      { name: '中介/代办', examples: ['工商注册', '资质代办', '资源对接', '租房/二手中介'] },
    ],
    hot: false,
  },
  {
    key: 'other',
    title: '其他小众 / 垂直一人公司业务',
    subtitle: '细分市场、差异化竞争',
    icon: <AppstoreOutlined />,
    color: '#8b5cf6',
    description: '翻译、代运营、数据调研、配音等细分服务',
    items: [
      { name: '翻译/本地化', examples: ['笔译', '口译', '字幕翻译', '文档本地化', '跨境文案润色'] },
      { name: '代运营', examples: ['新媒体代运营', '小店代运营', '社群维护', '小红书/抖音账号代更'] },
      { name: '数据/调研', examples: ['行业调研', '数据整理', '数据分析', '报告撰写', '问卷统计'] },
      { name: '配音/播音', examples: ['有声书', '广告配音', '短视频旁白', '课件朗读'] },
    ],
    hot: false,
  },
];

interface MakerAIProps {
  activeFeature?: string | null;
  onFeatureChange?: (feature: string | null) => void;
}

/** BP生成器面板 */
const BPGeneratorPanel: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [industry, setIndustry] = useState('');
  const [model, setModel] = useState('saas');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const models = [
    { key: 'saas', label: 'SaaS/软件' },
    { key: 'ecommerce', label: '电商/零售' },
    { key: 'content', label: '内容/IP' },
    { key: 'service', label: '服务/咨询' },
    { key: 'hardware', label: '硬件/制造' },
  ];

  const handleGenerate = async () => {
    if (!projectName.trim() || !industry.trim()) return;
    setGenerating(true);
    setResult('');
    setError('');
    try {
      const systemPrompt = `你是一位资深商业计划书(BP)撰写专家，擅长为大学生创业项目撰写专业BP。请用Markdown格式输出完整的商业计划书，包含以下章节：
1. 执行摘要
2. 市场痛点与机会
3. 产品/服务介绍
4. 商业模式
5. 市场规模与竞争分析
6. 营销策略
7. 团队介绍
8. 财务预测（3年）
9. 融资需求与资金用途
10. 里程碑与规划
请确保内容专业、数据合理、结构清晰。`;
      const prompt = `请为以下项目生成一份完整的商业计划书：\n项目名称：${projectName}\n所属行业：${industry}\n商业模式：${models.find(m => m.key === model)?.label}\n请直接输出BP内容。`;
      let fullContent = '';
      await chatWithZhipuStream(
        [{ role: 'user', content: prompt }],
        (chunk) => { fullContent += chunk; setResult(fullContent); },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 4000 }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #10b98120, #05966940)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <FileTextOutlined style={{ fontSize: 28, color: '#10b981' }} />
        </div>
        <Title level={4} style={{ margin: '0 0 4px' }}>BP生成器</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>输入项目信息，AI自动生成完整商业计划书</Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>项目名称</Text>
          <Input placeholder="如：青宸智汇 大学生创业平台" value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ borderRadius: 10, height: 40 }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>所属行业</Text>
          <Input placeholder="如：人工智能、电商、教育科技" value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ borderRadius: 10, height: 40 }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>商业模式</Text>
          <Space wrap>
            {models.map((m) => (
              <Button key={m.key} type={model === m.key ? 'primary' : 'default'} size="small" onClick={() => setModel(m.key)} style={{ borderRadius: 6, fontSize: 12 }}>
                {m.label}
              </Button>
            ))}
          </Space>
        </div>
        <Button
          type="primary"
          block
          loading={generating}
          disabled={!projectName.trim() || !industry.trim()}
          onClick={handleGenerate}
          style={{ borderRadius: 10, height: 44, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}
        >
          {generating ? 'AI生成中...' : '生成商业计划书'}
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginTop: 16, borderRadius: 10 }} />}

      {result && (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 15 }}>生成结果</Text>
            <Button size="small" onClick={() => { navigator.clipboard.writeText(result); }}>复制全文</Button>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

/** PPT大纲面板 */
const PPTOutlinePanel: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('investor');
  const [slides, setSlides] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const audiences = [
    { key: 'investor', label: '投资人路演' },
    { key: 'competition', label: '创业大赛' },
    { key: 'class', label: '课堂展示' },
    { key: 'internal', label: '内部汇报' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult('');
    setError('');
    try {
      const systemPrompt = `你是一位专业的路演PPT设计顾问，擅长为大学生创业项目设计路演大纲。请根据主题和场景，输出结构化的PPT大纲，每页包含：标题、核心内容要点、视觉建议。用Markdown格式输出。`;
      const prompt = `请为以下路演主题设计一份PPT大纲：\n主题：${topic}\n场景：${audiences.find(a => a.key === audience)?.label}\n页数：约${slides}页\n请输出每页的标题、内容和视觉建议。`;
      let fullContent = '';
      await chatWithZhipuStream(
        [{ role: 'user', content: prompt }],
        (chunk) => { fullContent += chunk; setResult(fullContent); },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 3000 }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #10b98120, #05966940)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <VideoCameraOutlined style={{ fontSize: 28, color: '#10b981' }} />
        </div>
        <Title level={4} style={{ margin: '0 0 4px' }}>PPT大纲生成器</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>输入路演主题，AI自动生成PPT大纲结构</Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>路演主题</Text>
          <Input placeholder="如：AI智能体创业平台路演" value={topic} onChange={(e) => setTopic(e.target.value)} style={{ borderRadius: 10, height: 40 }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>路演场景</Text>
          <Space wrap>
            {audiences.map((a) => (
              <Button key={a.key} type={audience === a.key ? 'primary' : 'default'} size="small" onClick={() => setAudience(a.key)} style={{ borderRadius: 6, fontSize: 12 }}>
                {a.label}
              </Button>
            ))}
          </Space>
        </div>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>页数：{slides} 页</Text>
          <input type="range" min="5" max="15" value={slides} onChange={(e) => setSlides(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <Button
          type="primary"
          block
          loading={generating}
          disabled={!topic.trim()}
          onClick={handleGenerate}
          style={{ borderRadius: 10, height: 44, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}
        >
          {generating ? 'AI生成中...' : '生成PPT大纲'}
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginTop: 16, borderRadius: 10 }} />}

      {result && (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 15 }}>PPT大纲</Text>
            <Button size="small" onClick={() => { navigator.clipboard.writeText(result); }}>复制全文</Button>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

/** 产品文档面板 */
const ProductDocPanel: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [docType, setDocType] = useState('prd');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const docTypes = [
    { key: 'prd', label: '产品需求文档 (PRD)' },
    { key: 'manual', label: '用户手册' },
    { key: 'api', label: 'API技术文档' },
  ];

  const handleGenerate = async () => {
    if (!productName.trim()) return;
    setGenerating(true);
    setResult('');
    setError('');
    try {
      const docTypeLabel = docTypes.find((d) => d.key === docType)?.label;
      const systemPrompt = `你是一位资深产品经理，擅长撰写各类产品文档。请根据提供的产品信息，输出专业、详细、结构化的${docTypeLabel}。使用Markdown格式。`;
      const prompt = `请为以下产品生成${docTypeLabel}：\n产品名称：${productName}\n产品描述：${productDesc || '暂无详细描述'}\n请直接输出文档内容。`;
      let fullContent = '';
      await chatWithZhipuStream(
        [{ role: 'user', content: prompt }],
        (chunk) => { fullContent += chunk; setResult(fullContent); },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 4000 }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #10b98120, #05966940)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <BookOutlined style={{ fontSize: 28, color: '#10b981' }} />
        </div>
        <Title level={4} style={{ margin: '0 0 4px' }}>产品文档生成器</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>输入产品信息，AI自动生成各类产品文档</Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>产品名称</Text>
          <Input placeholder="如：青宸智汇 创业平台" value={productName} onChange={(e) => setProductName(e.target.value)} style={{ borderRadius: 10, height: 40 }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>产品简介（可选）</Text>
          <Input.TextArea placeholder="简要描述产品功能和目标用户..." value={productDesc} onChange={(e) => setProductDesc(e.target.value)} rows={3} style={{ borderRadius: 10 }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>文档类型</Text>
          <Space wrap>
            {docTypes.map((t) => (
              <Button key={t.key} type={docType === t.key ? 'primary' : 'default'} size="small" onClick={() => setDocType(t.key)} style={{ borderRadius: 6, fontSize: 12 }}>
                {t.label}
              </Button>
            ))}
          </Space>
        </div>
        <Button
          type="primary"
          block
          loading={generating}
          disabled={!productName.trim()}
          onClick={handleGenerate}
          style={{ borderRadius: 10, height: 44, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 600 }}
        >
          {generating ? 'AI生成中...' : '生成产品文档'}
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginTop: 16, borderRadius: 10 }} />}

      {result && (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 15 }}>生成结果</Text>
            <Button size="small" onClick={() => { navigator.clipboard.writeText(result); }}>复制全文</Button>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

const MakerAI: React.FC<MakerAIProps> = ({ activeFeature: propFeature, onFeatureChange }) => {
  const [localFeature, setLocalFeature] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof businessCategories[0] | null>(null);
  const [activeWorkBoard, setActiveWorkBoard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤分类
  const filteredCategories = searchQuery
    ? businessCategories.filter(cat =>
        cat.title.includes(searchQuery) ||
        cat.items.some(item =>
          item.name.includes(searchQuery) ||
          item.examples.some(ex => ex.includes(searchQuery))
        )
      )
    : businessCategories;

  const activeFeature = propFeature !== undefined ? propFeature : localFeature;
  const setActiveFeature = onFeatureChange || setLocalFeature;

  // 渲染技能库面板
  const renderSkillsPanel = () => {
    return (
      <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Title level={4} style={{ margin: '0 0 8px' }}>
            <ToolOutlined style={{ marginRight: 8, color: '#a855f7' }} />
            超级个体创业技能库
          </Title>
          <Text type="secondary">选择适合你的创业方向，开启一人公司之旅</Text>
        </div>

        <Input.Search
          placeholder="搜索创业方向、技能或服务..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: 20 }}
          allowClear
        />

        <Row gutter={[16, 16]}>
          {filteredCategories.map(category => (
            <Col span={12} key={category.key}>
              <Card
                hoverable
                onClick={() => setActiveWorkBoard(category.key)}
                style={{
                  borderRadius: 12,
                  border: '1px solid #f0f0f0',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                styles={{ body: { padding: '16px' } }}
              >
                {category.hot && (
                  <Badge
                    count={<Tag color="red" style={{ fontSize: 10 }}>热门</Tag>}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}40 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: category.color,
                    flexShrink: 0,
                  }}>
                    {category.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 15 }}>{category.title}</Text>
                    </div>
                    <Tag color="purple" style={{ fontSize: 11, marginBottom: 6 }}>{category.subtitle}</Tag>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {category.description}
                    </Paragraph>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {category.items.length} 个细分领域 · {category.items.reduce((acc, item) => acc + item.examples.length, 0)} 个技能点
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  // 渲染工作看板
  const renderWorkBoard = () => {
    if (!activeWorkBoard) return null;
    const category = businessCategories.find(c => c.key === activeWorkBoard);
    if (!category) return null;

    return (
      <Modal
        title={null}
        open={!!activeWorkBoard}
        onCancel={() => setActiveWorkBoard(null)}
        width={900}
        style={{ top: 20 }}
        footer={null}
        styles={{ body: { padding: 0 } }}
      >
        <WorkBoard
          category={category}
          onClose={() => setActiveWorkBoard(null)}
        />
      </Modal>
    );
  };

  // 渲染详情弹窗
  const renderDetailModal = () => {
    if (!selectedCategory) return null;

    return (
      <Modal
        title={null}
        open={!!selectedCategory}
        onCancel={() => setSelectedCategory(null)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setSelectedCategory(null)}>关闭</Button>,
          <Button
            key="action"
            type="primary"
            style={{ background: selectedCategory.color, borderColor: selectedCategory.color }}
            onClick={() => {
              setSelectedCategory(null);
              setActiveWorkBoard(selectedCategory.key);
            }}
          >
            进入工作台 <RightOutlined />
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${selectedCategory.color}20 0%, ${selectedCategory.color}40 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            color: selectedCategory.color,
            margin: '0 auto 16px',
          }}>
            {selectedCategory.icon}
          </div>
          <Title level={3} style={{ margin: '0 0 8px' }}>{selectedCategory.title}</Title>
          <Tag color="purple">{selectedCategory.subtitle}</Tag>
          <Paragraph style={{ margin: '12px 0 0', color: 'var(--text-secondary)' }}>
            {selectedCategory.description}
          </Paragraph>
        </div>

        <Divider />

        <div>
          {selectedCategory.items.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '12px 0',
                borderBottom: index < selectedCategory.items.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: 15 }}>{item.name}</Text>
              </div>
              <div>
                {item.examples.map((example, idx) => (
                  <Tag
                    key={idx}
                    style={{
                      margin: '0 8px 8px 0',
                      background: `${selectedCategory.color}10`,
                      borderColor: `${selectedCategory.color}30`,
                      color: selectedCategory.color,
                    }}
                  >
                    {example}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Divider />

        <div style={{ background: '#fafafa', borderRadius: 8, padding: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            <FireOutlined style={{ color: '#f59e0b', marginRight: 6 }} />
            创业建议
          </Text>
          <Paragraph style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            建议从你最擅长的细分领域开始，先完成一个最小可行产品(MVP)，验证市场需求后再扩展。
            利用AI工具可以大幅提升效率，降低启动成本。
          </Paragraph>
        </div>
      </Modal>
    );
  };

  // 根据当前激活的功能渲染对应面板
  const renderFeaturePanel = () => {
    if (!activeFeature) return undefined;

    const panelContent = (() => {
      switch (activeFeature) {
        case 'skills':
          return renderSkillsPanel();
        case 'bp':
          return <BPGeneratorPanel />;
        case 'ppt':
          return <PPTOutlinePanel />;
        case 'docs':
          return <ProductDocPanel />;
        case 'demo':
          return <PrototypeDemoPanel />;
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
    <>
      <ChatLayout
        role="maker"
        title="工匠AI"
        icon={<ToolOutlined />}
        description="超级个体创业技能库 - 九大创业方向任你选择"
        featurePanel={renderFeaturePanel()}
      />
      {renderDetailModal()}
      {renderWorkBoard()}
    </>
  );
};

export default MakerAI;
