/**
 * AI 供应商搜索面板 - 探路者 Scout 功能组件
 * 聚焦算力、模型、科技公司等 AI 供应商
 */

import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Tag, Rate, Empty, Spin, Space, Row, Col, Avatar, Badge, Progress, Divider, Modal } from 'antd';
import { SearchOutlined, ShopOutlined, EnvironmentOutlined, StarOutlined, CheckCircleOutlined, TeamOutlined, BarChartOutlined, PhoneOutlined, GlobalOutlined, MailOutlined, HomeOutlined, CloseOutlined } from '@ant-design/icons';
import { searchSuppliers, type Supplier } from '../../services/scoutService';
import { useTheme } from '../../contexts/ThemeContext';

interface SupplierSearchPanelProps {
  onSelectSuppliers?: (suppliers: Supplier[]) => void;
}

// AI 供应商分类
const categoryOptions = [
  { value: 'all', label: '全部类目', color: '#64748b', icon: '📋' },
  { value: 'computing', label: '算力服务', color: '#1890ff', icon: '⚡' },
  { value: 'model', label: 'AI 模型', color: '#52c41a', icon: '🧠' },
  { value: 'technology', label: '科技公司', color: '#722ed1', icon: '🚀' },
  { value: 'data', label: '数据服务', color: '#faad14', icon: '📊' },
  { value: 'cloud', label: '云服务', color: '#13c2c2', icon: '☁️' },
];

// 地区选项
const regionOptions = [
  { value: 'all', label: '全部地区', color: '#64748b', icon: '🌐' },
  { value: 'beijing', label: '北京', color: '#1890ff', icon: '🏛️' },
  { value: 'shanghai', label: '上海', color: '#52c41a', icon: '🌃' },
  { value: 'shenzhen', label: '深圳', color: '#faad14', icon: '🏙️' },
  { value: 'hangzhou', label: '杭州', color: '#722ed1', icon: '🌸' },
  { value: 'guangzhou', label: '广州', color: '#eb2f96', icon: '🌺' },
  { value: 'chengdu', label: '成都', color: '#13c2c2', icon: '🐼' },
  { value: 'other', label: '其他', color: '#fa541c', icon: '📍' },
];

const categoryLabelMap: Record<string, string> = {
  all: '全部类目',
  computing: '算力服务',
  model: 'AI 模型',
  technology: '科技公司',
  data: '数据服务',
  cloud: '云服务',
};

const regionLabelMap: Record<string, string> = {
  all: '全部地区',
  beijing: '北京',
  shanghai: '上海',
  shenzhen: '深圳',
  hangzhou: '杭州',
  guangzhou: '广州',
  chengdu: '成都',
  other: '其他',
};

// 扩展的供应商数据接口
interface AISupplier extends Supplier {
  fullDescription: string;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  website: string;
  founded: string;
  employees: string;
  products: string[];
  bgImage: string;
}

// 使用各公司真实办公楼/总部大楼图片
const mockSuppliers: AISupplier[] = [
  {
    id: '1',
    name: 'NVIDIA 英伟达',
    category: 'computing',
    region: 'other',
    rating: 4.9,
    description: '全球领先GPU 算力提供商，AI 训练与推理首选',
    fullDescription: 'NVIDIA 是全球领先的图形处理器（GPU）和 AI 计算平台提供商。其数据中心业务为大规模 AI 训练、推理和科学计算提供强大的算力支持。产品包括A100、H100、H200 等数据中心GPU，以及DGX 超级计算机系统。NVIDIA 的CUDA 生态已成为 AI 开发的标准平台',
    contact: {
      phone: '+1-408-486-2000',
      email: 'enterprise@nvidia.com',
      address: '2788 San Tomas Expressway, Santa Clara, CA 95051, USA',
    },
    website: 'https://www.nvidia.com',
    founded: '1993',
    employees: '29,600+',
    products: ['A100 GPU', 'H100 GPU', 'DGX 系统', 'CUDA 平台', 'TensorRT'],
    bgImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  },
  {
    id: '2',
    name: 'OpenAI',
    category: 'model',
    region: 'other',
    rating: 4.8,
    description: 'GPT 系列大模型开创者，引领生成式AI 革命',
    fullDescription: 'OpenAI 是一家专注于通用人工智能（AGI）研发的美国 AI 公司。其开发的 GPT 系列大语言模型（GPT-3.5、GPT-4、GPT-4o）和 DALL-E 图像生成模型引领了全球生成式 AI 的发展。通过 ChatGPT 的 API 服务，OpenAI 为开发者和企业提供先进的自然语言处理能力',
    contact: {
      phone: '+1-800-555-0199',
      email: 'support@openai.com',
      address: '3180 18th St, San Francisco, CA 94110, USA',
    },
    website: 'https://openai.com',
    founded: '2015',
    employees: '1,500+',
    products: ['GPT-4', 'GPT-4o', 'DALL-E 3', 'Whisper', 'Embeddings API'],
    bgImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  },
  {
    id: '3',
    name: '百度智能云',
    category: 'technology',
    region: 'beijing',
    rating: 4.6,
    description: '文心一言、飞桨平台，全栈 AI 技术能力',
    fullDescription: '百度智能云是百度旗下的云计算与AI 服务平台，提供从芯片层到应用层的全栈 AI 能力。核心产品包括文心一言大模型、飞桨深度学习平台、百度大脑等。在自动驾驶（Apollo）、智能交通、企业智能化转型等领域具有领先地位',
    contact: {
      phone: '400-920-0000',
      email: 'cloud@baidu.com',
      address: '北京市海淀区上地十街10号百度大厦',
    },
    website: 'https://cloud.baidu.com',
    founded: '2000',
    employees: '45,000+',
    products: ['文心一言', '飞桨 PaddlePaddle', '百度大脑', 'Apollo 自动驾驶', '智能云服务器'],
    bgImage: 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=800&q=80',
  },
  {
    id: '4',
    name: '阿里云',
    category: 'cloud',
    region: 'hangzhou',
    rating: 4.7,
    description: '通义千问、PAI 平台，亚太最大云服务商',
    fullDescription: '阿里云是阿里巴巴集团旗下云计算品牌，亚太地区市场份额第一的云服务提供商。在 AI 领域提供通义千问大模型、PAI 机器学习平台、灵骏智算集群等产品。支持从模型训练、推理部署到应用集成的全流程 AI 开发',
    contact: {
      phone: '95187',
      email: 'support@aliyun.com',
      address: '杭州市余杭区五常街道文一西路969号阿里巴巴西溪园区',
    },
    website: 'https://www.aliyun.com',
    founded: '2009',
    employees: '20,000+',
    products: ['通义千问', 'PAI 平台', '灵骏智算', '机器学习引擎', 'AI 加速器'],
    bgImage: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=800&q=80',
  },
  {
    id: '5',
    name: '商汤科技',
    category: 'technology',
    region: 'shanghai',
    rating: 4.5,
    description: '计算机视觉与深度学习平台，SenseCore 大装置',
    fullDescription: '商汤科技是全球领先的人工智能软件公司，专注于计算机视觉和深度学习技术。其 SenseCore AI 大装置提供从算力、算法到平台的全栈服务。在智慧城市、自动驾驶、智慧医疗、教育等领域有广泛应用',
    contact: {
      phone: '400-900-5988',
      email: 'contact@sensetime.com',
      address: '上海市徐汇区虹梅路1900号商汤科技大厦',
    },
    website: 'https://www.sensetime.com',
    founded: '2014',
    employees: '6,000+',
    products: ['SenseCore 大装置', '日日新大模型', 'SenseNova', '智慧城市管理', '自动驾驶方案'],
    bgImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80',
  },
  {
    id: '6',
    name: '华为云',
    category: 'cloud',
    region: 'shenzhen',
    rating: 4.6,
    description: '盘古大模型、昇腾AI，全场景智慧生态',
    fullDescription: '华为云是华为旗下的云计算服务品牌，依托华为在 ICT 领域的技术积累，提供稳定可靠、安全可信的云服务。AI 方面提供盘古大模型系列、昇腾AI 处理器、ModelArts 开发平台等，覆盖金融、制造、矿山、气象等行业',
    contact: {
      phone: '4000-955-988',
      email: 'support@huaweicloud.com',
      address: '深圳市龙岗区坂田华为基地',
    },
    website: 'https://www.huaweicloud.com',
    founded: '2011',
    employees: '19,500+',
    products: ['盘古大模型', '昇腾 AI', 'ModelArts', 'MindSpore', 'Atlas 硬件'],
    bgImage: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80',
  },
  {
    id: '7',
    name: '科大讯飞',
    category: 'model',
    region: 'other',
    rating: 4.4,
    description: '星火认知大模型，智能语音与NLP 领导者',
    fullDescription: '科大讯飞是中国领先的智能语音和人工智能企业，长期从事语音及语言、自然语言理解、机器学习推理等核心技术研究。其讯飞星火认知大模型在中文理解、知识问答、逻辑推理等方面表现优异。在教育、医疗、司法、汽车等领域深度应用',
    contact: {
      phone: '400-019-9999',
      email: 'service@iflytek.com',
      address: '合肥市高新区望江西路666号科大讯飞语音产业基地',
    },
    website: 'https://www.xfyun.cn',
    founded: '1999',
    employees: '10,000+',
    products: ['讯飞星火', '智能语音交互', '讯飞听见', '智慧教育', '智医助理'],
    bgImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  },
  {
    id: '8',
    name: '智谱 AI',
    category: 'model',
    region: 'beijing',
    rating: 4.5,
    description: 'ChatGLM 系列大模型，清华技术背景',
    fullDescription: '智谱 AI 是由清华大学计算机系知识工程实验室（KEG）技术成果转化而来的人工智能公司。其核心产品 ChatGLM 系列大模型（ChatGLM-6B、ChatGLM2、ChatGLM3、GLM-4）在中文大模型领域具有重要影响力。提供开源和商业 API 服务',
    contact: {
      phone: '010-82158889',
      email: 'contact@zhipuai.cn',
      address: '北京市海淀区中关村东路1号院清华科技园',
    },
    website: 'https://www.zhipuai.cn',
    founded: '2019',
    employees: '800+',
    products: ['ChatGLM 系列', 'GLM-4', 'CodeGeeX', 'CogView', '智谱清言'],
    bgImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  },
  {
    id: '9',
    name: '燧原科技',
    category: 'computing',
    region: 'shanghai',
    rating: 4.3,
    description: '国产 AI 训练与推理芯片，专注云端算力',
    fullDescription: '燧原科技是中国领先的 AI 芯片设计公司，专注于人工智能领域云端算力产品。其邃思系列AI 训练芯片和云燧系列加速卡为数据中心提供高性能、高能效AI 计算能力。产品广泛应用于互联网、金融、交通、能源等行业',
    contact: {
      phone: '021-61630288',
      email: 'contact@enflame-tech.com',
      address: '上海市浦东新区金秋路158号张润大厦3号楼',
    },
    website: 'https://www.enflame-tech.com',
    founded: '2018',
    employees: '800+',
    products: ['邃思芯片', '云燧 T20/T21', '云燧 i20', '驭算软件', 'AI 计算集群'],
    bgImage: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80',
  },
  {
    id: '10',
    name: '壁仞科技',
    category: 'computing',
    region: 'shanghai',
    rating: 4.2,
    description: '通用 GPU 芯片设计，BR100 系列高性能算力',
    fullDescription: '壁仞科技是中国领先的通用 GPU 芯片设计公司，致力于开发原创性的通用计算体系。其 BR100 系列通用 GPU 芯片在算力密度、能效比等方面达到国际先进水平。产品面向数据中心、智算中心、自动驾驶等高性能计算场景',
    contact: {
      phone: '021-61630299',
      email: 'contact@birentech.com',
      address: '上海市浦东新区张江高科技园区海趣路88号',
    },
    website: 'https://www.birentech.com',
    founded: '2019',
    employees: '900+',
    products: ['BR100 GPU', 'BR104 GPU', '壁砺系列', 'BIRENSUPA 软件平台', 'AI 推理卡'],
    bgImage: 'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=800&q=80',
  },
  {
    id: '11',
    name: '字节跳动火山引擎',
    category: 'cloud',
    region: 'beijing',
    rating: 4.5,
    description: '豆包大模型、推荐算法，企业级云服务平台',
    fullDescription: '火山引擎是字节跳动旗下的企业级技术服务平台，将字节跳动内部沉淀的推荐算法、音视频处理、数据分析等能力对外开放。AI 方面提供豆包大模型、火山方舟MaaS 平台、智能创作等能力，帮助企业实现智能化转型',
    contact: {
      phone: '400-9922-888',
      email: 'support@volcengine.com',
      address: '北京市海淀区知春路63号中国卫星通信大厦',
    },
    website: 'https://www.volcengine.com',
    founded: '2020',
    employees: '10,000+',
    products: ['豆包大模型', '火山方舟', '推荐引擎', '智能创作', '视频云'],
    bgImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
  },
  {
    id: '12',
    name: '寒武纪',
    category: 'computing',
    region: 'beijing',
    rating: 4.3,
    description: 'AI 芯片第一股，思元系列云端与边缘芯片',
    fullDescription: '寒武纪是中国首家科创板上市的 AI 芯片设计公司，专注于人工智能芯片产品的研发与技术创新。其思元（MLU）系列智能芯片覆盖云端训练、云端推理和边缘计算全场景。产品广泛应用于互联网、金融、轨交、电力等行业',
    contact: {
      phone: '010-83030796',
      email: 'business@cambricon.com',
      address: '北京市海淀区知春路7号致真大厦D座',
    },
    website: 'https://www.cambricon.com',
    founded: '2016',
    employees: '1,500+',
    products: ['思元 370', '思元 590', '玄思1000', 'Cambricon Neuware', '边缘计算卡'],
    bgImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
  },
];

const SupplierSearchPanel: React.FC<SupplierSearchPanelProps> = ({ onSelectSuppliers }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AISupplier[]>(mockSuppliers);
  const [hasSearched, setHasSearched] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<AISupplier | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode } = useTheme();

  const handleSearch = async () => {
    const values = await form.validateFields();
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchSuppliers({ keyword: values.keyword, category: values.category, region: values.region });
      setResults(data.length > 0 ? (data as AISupplier[]) : mockSuppliers);
      onSelectSuppliers?.(data);
    } catch (error) {
      console.error('搜索供应商失败', error);
      setResults(mockSuppliers);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (supplier: AISupplier) => {
    setSelectedSupplier(supplier);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedSupplier(null);
  };

  const avgRating = results.length > 0 ? (results.reduce((sum, s) => sum + s.rating, 0) / results.length).toFixed(1) : '0';
  const categoryCount = new Set(results.map(s => s.category)).size;

  return (
    <div style={{ background: isDarkMode ? '#0d1117' : 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题*/}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }} icon={<ShopOutlined />} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>AI 供应商搜索</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>发现优质 AI 算力、模型与科技服务</div>
          </div>
        </div>
        <Row gutter={12}>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 8px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{results.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>供应商</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 8px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{avgRating}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>平均评分</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 8px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{categoryCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>覆盖类目</div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 类别快捷选择 */}
      <div style={{ padding: '16px', background: isDarkMode ? '#0d1117' : undefined }}>
        <div style={{ fontSize: 13, color: isDarkMode ? '#8b949e' : '#666', marginBottom: 12, fontWeight: 'bold' }}>
          <BarChartOutlined /> 热门类别
        </div>
        <Space wrap>
          {categoryOptions.map(cat => (
            <Tag key={cat.value} color={cat.color} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 13, borderRadius: 16, border: 'none' }} onClick={() => form.setFieldsValue({ category: cat.value })}>
              <span style={{ marginRight: 4 }}>{cat.icon}</span>{cat.label}
            </Tag>
          ))}
        </Space>
      </div>

      <Divider style={{ margin: 0, borderColor: isDarkMode ? '#30363d' : undefined }} />

      {/* 搜索表单 */}
      <div style={{ padding: '16px', background: isDarkMode ? '#0d1117' : undefined }}>
        <Form form={form} layout="vertical" size="middle">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="category" label={<span style={{ color: isDarkMode ? '#c9d1d9' : '#374151', fontWeight: 600, fontSize: 14 }}><ShopOutlined style={{ marginRight: 4 }} />类目</span>}>
                <Select 
                  showSearch
                  placeholder="搜索选择类目" 
                  allowClear 
                  optionFilterProp="label"
                  style={{ 
                    borderRadius: 8,
                  }}
                  size="large"
                  styles={isDarkMode ? { popup: { root: { background: '#161b22' } } } : undefined}
                >
                  {categoryOptions.map(c => <Select.Option key={c.value} value={c.value}><span style={{ marginRight: 8 }}>{c.icon}</span>{c.label}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="region" label={<span style={{ color: isDarkMode ? '#c9d1d9' : '#374151', fontWeight: 600, fontSize: 14 }}><EnvironmentOutlined style={{ marginRight: 4 }} />地区</span>}>
                <Select 
                  showSearch
                  placeholder="搜索选择地区" 
                  allowClear 
                  optionFilterProp="label"
                  style={{ 
                    borderRadius: 8,
                  }}
                  size="large"
                  styles={isDarkMode ? { popup: { root: { background: '#161b22' } } } : undefined}
                >
                  {regionOptions.map(r => <Select.Option key={r.value} value={r.value}><span style={{ marginRight: 8 }}>{r.icon}</span>{r.label}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="keyword" label={<span style={{ color: isDarkMode ? '#c9d1d9' : '#374151', fontWeight: 600, fontSize: 14 }}><SearchOutlined style={{ marginRight: 4 }} />关键词</span>}>
            <Input 
              placeholder="输入公司名称或AI产品关键词..." 
              allowClear 
              style={{ 
                borderRadius: 8, 
                background: isDarkMode ? '#161b22' : '#ffffff',
                borderColor: isDarkMode ? '#30363d' : '#94a3b8',
                color: isDarkMode ? '#c9d1d9' : '#1f2937',
              }}
              size="large" 
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading} block size="large" style={{ borderRadius: 8, height: 44, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', border: 'none' }}>
              搜索供应            </Button>
          </Form.Item>
        </Form>
      </div>

      <Divider style={{ margin: 0, borderColor: isDarkMode ? '#30363d' : undefined }} />

      {/* 结果列表 */}
      <div style={{ padding: '16px', background: isDarkMode ? '#0d1117' : undefined }}>
        <Spin spinning={loading}>
          {hasSearched && results.length === 0 ? (
            <Empty 
              description={<span style={{ color: isDarkMode ? '#8b949e' : undefined }}>未找到匹配的供应商</span>} 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              style={{ marginTop: 20 }} 
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.map((item) => {
                const catConfig = categoryOptions.find(c => c.value === item.category);
                const regConfig = regionOptions.find(r => r.value === item.region);
                return (
                  <Card
                    key={item.id}
                    hoverable
                    onClick={() => handleCardClick(item)}
                    style={{ 
                      marginBottom: 12, 
                      borderRadius: 12, 
                      border: isDarkMode ? '1px solid #30363d' : 'none', 
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)', 
                      overflow: 'hidden', 
                      cursor: 'pointer',
                      background: isDarkMode ? '#161b22' : '#fff',
                    }}
                    styles={{ body: { padding: 0 } }}
                  >
                    {/* 背景图区*/}
                    <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: '#1a1a2e' }}>
                      <img
                        src={item.bgImage}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* 渐变遮罩 */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ color: '#fff', flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 'bold', textShadow: '0 2px 6px rgba(0,0,0,0.8)', color: '#ffffff' }}>{item.name}</div>
                          <div style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, textShadow: '0 1px 4px rgba(0,0,0,0.8)', color: '#f1f5f9' }}>
                            <span>⭐{item.rating} 分</span>
                            <span>·</span>
                            <span>{categoryLabelMap[item.category]}</span>
                            <span>·</span>
                            <span>{item.founded} 年成立</span>
                          </div>
                        </div>
                        <Badge status="success" text={<span style={{ color: '#ffffff', fontSize: 12, textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontWeight: 500 }}>已认证</span>} />
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <Space wrap style={{ marginBottom: 12 }}>
                        <Tag color={catConfig.color} style={{ borderRadius: 4 }}>{catConfig.icon} {categoryLabelMap[item.category]}</Tag>
                        <Tag icon={<EnvironmentOutlined />} color={regConfig.color} style={{ borderRadius: 4 }}>{regConfig.icon} {regionLabelMap[item.region]}</Tag>
                        <Tag style={{ borderRadius: 4, background: isDarkMode ? '#21262d' : '#f0f0f0', border: 'none', color: isDarkMode ? '#c9d1d9' : undefined }}>👥 {item.employees}</Tag>
                      </Space>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <Rate disabled defaultValue={item.rating} style={{ fontSize: 14 }} />
                        <Progress percent={item.rating * 20} showInfo={false} strokeColor={item.rating >= 4.5 ? '#52c41a' : '#faad14'} style={{ width: 80, marginLeft: 12 }} size="small" />
                      </div>
                      {item.description && <div style={{ fontSize: 13, color: isDarkMode ? '#8b949e' : '#666', lineHeight: 1.7 }}>{item.description}</div>}
                      {/* 产品标签 */}
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {item.products.slice(0, 3).map((product, idx) => (
                          <span key={idx} style={{ fontSize: 11, color: '#1890ff', background: isDarkMode ? 'rgba(24,144,255,0.15)' : 'rgba(24,144,255,0.08)', padding: '2px 8px', borderRadius: 4 }}>{product}</span>
                        ))}
                        {item.products.length > 3 && (
                          <span style={{ fontSize: 11, color: isDarkMode ? '#8b949e' : '#999' }}>+{item.products.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Spin>
      </div>

      {/* 公司详情弹窗 */}
      <Modal
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        styles={{ body: { padding: 0 } }}
        closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
        style={{ top: 20 }}
      >
        {selectedSupplier && (
          <div>
            {/* 弹窗头部背景 */}
            <div style={{ height: 220, position: 'relative', overflow: 'hidden', background: '#1a1a2e' }}>
              <img
                src={selectedSupplier.bgImage}
                alt={selectedSupplier.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* 渐变遮罩 */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{selectedSupplier.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <Rate disabled defaultValue={selectedSupplier.rating} style={{ fontSize: 16 }} />
                  <span style={{ color: '#fff', fontSize: 14, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{selectedSupplier.rating} 分</span>
                  <Tag color="success" style={{ margin: 0 }}>已认证</Tag>
                </div>
              </div>
            </div>

            {/* 弹窗内容 */}
            <div style={{ padding: '24px' }}>
              {/* 基本信息 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamOutlined /> 公司简                </div>
                <p style={{ color: '#4b5563', lineHeight: 1.8, fontSize: 14, margin: 0 }}>
                  {selectedSupplier.fullDescription}
                </p>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* 产品与标*/}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChartOutlined /> 核心产品
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedSupplier.products.map((product, idx) => (
                    <Tag key={idx} color="blue" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 6 }}>{product}</Tag>
                  ))}
                  </div>
                </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* 联系方式 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PhoneOutlined /> 联系方式
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PhoneOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                    <span style={{ color: '#4b5563', fontSize: 14 }}>{selectedSupplier.contact.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MailOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                    <span style={{ color: '#4b5563', fontSize: 14 }}>{selectedSupplier.contact.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <HomeOutlined style={{ color: '#1890ff', fontSize: 14, marginTop: 3 }} />
                    <span style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>{selectedSupplier.contact.address}</span>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* 基本信息 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GlobalOutlined /> 基本信息
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>成立时间</div>
                      <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 600 }}>{selectedSupplier.founded}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>员工规模</div>
                      <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 600 }}>{selectedSupplier.employees}</div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* 官网链接 */}
              <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<GlobalOutlined />}
                  href={selectedSupplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    borderRadius: 8,
                    height: 44,
                    padding: '0 32px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
                    border: 'none',
                    fontSize: 15,
                  }}
                >
                  访问官方网站
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplierSearchPanel;
