/**
 * 常见问题解答面板
 * 功能：展示常见问题、搜索、分类浏览、智能推荐、热门问题
 */

import React, { useState } from 'react';
import {
  Card,
  Input,
  List,
  Tag,
  Collapse,
  Space,
  Empty,
  Button,
  Badge,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  FileTextOutlined,
  BulbOutlined,
  ToolOutlined,
  CustomerServiceOutlined,
  CompassOutlined,
  FireOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  StarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  isHot?: boolean;
  isRecommended?: boolean;
  createdAt: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: '如何开始使用探路者AI进行市场调研？',
    answer: '1. 点击左侧菜单"探路者AI"\n2. 选择"市场调研"功能\n3. 输入你的创业方向和目标用户\n4. 等待AI生成调研报告\n5. 查看报告并保存到个人资料',
    category: '探路者AI',
    tags: ['市场调研', '新手入门'],
    views: 2340,
    likes: 156,
    isHot: true,
    isRecommended: true,
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    question: '军师AI生成的创业规划报告可以修改吗？',
    answer: '是的，你可以根据自己的实际情况调整报告内容。在生成报告后，点击"编辑"按钮即可修改。修改后的报告可以重新保存到个人资料中。',
    category: '军师AI',
    tags: ['报告编辑', '创业规划'],
    views: 1890,
    likes: 128,
    isRecommended: true,
    createdAt: '2024-01-20',
  },
  {
    id: 3,
    question: '工匠AI的工作台如何使用？',
    answer: '1. 点击左侧菜单"工匠AI"\n2. 选择"创业技能库"\n3. 点击你感兴趣的创业方向卡片\n4. 进入工作台后，按照四步流程操作：项目设定→服务选择→任务管理→执行记录\n5. 完成任务后点击"完成并关闭"',
    category: '工匠AI',
    tags: ['工作台', '任务管理'],
    views: 1560,
    likes: 98,
    createdAt: '2024-02-01',
  },
  {
    id: 4,
    question: '如何保存和查看生成的报告？',
    answer: '生成报告后，点击"保存到个人资料"按钮即可保存。你可以在"个人资料"页面的"报告收藏"标签下查看所有保存的报告。',
    category: '通用',
    tags: ['报告保存', '个人资料'],
    views: 3200,
    likes: 245,
    isHot: true,
    isRecommended: true,
    createdAt: '2024-01-10',
  },
  {
    id: 5,
    question: '管家AI的数据面板如何更新？',
    answer: '数据面板会自动同步你在其他AI中的操作数据。你也可以手动添加供应商和投资商信息，点击"添加"按钮即可。',
    category: '管家AI',
    tags: ['数据面板', '供应商管理'],
    views: 980,
    likes: 67,
    createdAt: '2024-02-10',
  },
  {
    id: 6,
    question: '如何提交问题反馈？',
    answer: '1. 点击管家AI左侧菜单"问题反馈"\n2. 填写反馈标题、类型、优先级和详细描述\n3. 点击"提交反馈"按钮\n4. 你可以在"反馈历史"中查看处理进度',
    category: '管家AI',
    tags: ['问题反馈', '售后支持'],
    views: 760,
    likes: 45,
    createdAt: '2024-02-15',
  },
  {
    id: 7,
    question: '创业规划报告中的融资建议可靠吗？',
    answer: '报告中的融资建议是基于行业数据和AI分析生成的，仅供参考。实际融资时建议咨询专业的财务顾问或投资机构。',
    category: '军师AI',
    tags: ['融资', '风险提示'],
    views: 1450,
    likes: 112,
    isHot: true,
    createdAt: '2024-01-25',
  },
  {
    id: 8,
    question: '工匠AI支持哪些创业方向？',
    answer: '目前支持9大创业方向：专业咨询、知识付费、数字产品、内容创作、设计服务、技术开发、轻电商、本地生活、其他小众业务。每个方向都有详细的工作台和任务管理功能。',
    category: '工匠AI',
    tags: ['创业方向', '功能介绍'],
    views: 2100,
    likes: 178,
    isRecommended: true,
    createdAt: '2024-01-18',
  },
  {
    id: 9,
    question: '如何导出创业规划报告？',
    answer: '在成果展示页面，点击"导出报告"按钮，选择导出格式（PDF/Word/Excel），系统会自动生成并下载报告文件。',
    category: '管家AI',
    tags: ['导出', '报告'],
    views: 1120,
    likes: 89,
    createdAt: '2024-02-20',
  },
  {
    id: 10,
    question: '探路者AI的政策数据从哪里获取？',
    answer: '政策数据来源于国家及地方政府公开发布的政策文件，我们会定期更新数据库，确保信息的准确性和时效性。',
    category: '探路者AI',
    tags: ['政策', '数据来源'],
    views: 890,
    likes: 56,
    createdAt: '2024-02-25',
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  '探路者AI': <CompassOutlined />,
  '军师AI': <BulbOutlined />,
  '工匠AI': <ToolOutlined />,
  '管家AI': <CustomerServiceOutlined />,
  '通用': <FileTextOutlined />,
};

const categoryColors: Record<string, string> = {
  '探路者AI': '#3b82f6',
  '军师AI': '#a855f7',
  '工匠AI': '#f59e0b',
  '管家AI': '#10b981',
  '通用': '#666',
};

// 智能推荐关键词
const recommendKeywords = ['新手入门', '报告保存', '创业规划', '工作台'];

const FAQPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [activeKey, setActiveKey] = useState<string | string[]>('');

  // 过滤FAQ
  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = !searchQuery ||
      item.question.includes(searchQuery) ||
      item.answer.includes(searchQuery) ||
      item.tags.some(tag => tag.includes(searchQuery));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 热门问题（按浏览量排序）
  const hotFAQs = [...faqData]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // 智能推荐（基于标签匹配）
  const recommendedFAQs = faqData.filter(item => 
    item.isRecommended || 
    item.tags.some(tag => recommendKeywords.includes(tag))
  ).slice(0, 4);

  // 获取所有分类
  const categories = Array.from(new Set(faqData.map(item => item.category)));

  // 统计信息
  const totalFAQs = faqData.length;
  const totalViews = faqData.reduce((sum, item) => sum + item.views, 0);
  const totalLikes = faqData.reduce((sum, item) => sum + item.likes, 0);

  const handleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleKeywordClick = (keyword: string) => {
    setSearchQuery(keyword);
  };

  return (
    <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
      {/* 标题区域 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
          <QuestionCircleOutlined style={{ marginRight: 8, color: '#3b82f6' }} />
          常见问题解答
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>快速找到你关心的问题和答案</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="问题总数"
              value={totalFAQs}
              prefix={<FileTextOutlined style={{ color: '#3b82f6' }} />}
              styles={{ content: { color: '#3b82f6', fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="总浏览量"
              value={totalViews}
              prefix={<EyeOutlined style={{ color: '#a855f7' }} />}
              styles={{ content: { color: '#a855f7', fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="总点赞数"
              value={totalLikes}
              prefix={<LikeOutlined style={{ color: '#f59e0b' }} />}
              styles={{ content: { color: '#f59e0b', fontWeight: 600 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索框 */}
      <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <Input.Search
          placeholder="搜索问题、关键词..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          allowClear
          size="large"
          style={{ borderRadius: 10 }}
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
        />
        {/* 快捷搜索标签 */}
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ marginRight: 8 }}>
            <ThunderboltOutlined style={{ marginRight: 4 }} />
            智能推荐：
          </Text>
          <Space wrap>
            {recommendKeywords.map(keyword => (
              <Tag
                key={keyword}
                color="purple"
                style={{ cursor: 'pointer', borderRadius: 4 }}
                onClick={() => handleKeywordClick(keyword)}
              >
                {keyword}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      {/* 热门问题区域 */}
      {!searchQuery && !selectedCategory && (
        <Card 
          style={{ 
            borderRadius: 12, 
            marginBottom: 24,
            background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
            border: '1px solid #ffccc7'
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0, color: '#cf1322' }}>
              <FireOutlined style={{ marginRight: 8 }} />
              热门问题
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              大家都在关注的问题
            </Text>
          </div>
          <List
            dataSource={hotFAQs}
            renderItem={(item, index) => (
              <List.Item
                style={{ 
                  cursor: 'pointer',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => {
                  setActiveKey([String(item.id)]);
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                  <Badge 
                    count={index + 1} 
                    style={{ 
                      backgroundColor: index < 3 ? '#cf1322' : '#999',
                      minWidth: 22,
                      height: 22,
                      lineHeight: '22px',
                      borderRadius: 11
                    }} 
                  />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ color: '#262626' }}>{item.question}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Space size={16}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          <EyeOutlined style={{ marginRight: 4 }} />
                          {item.views}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          <LikeOutlined style={{ marginRight: 4 }} />
                          {item.likes}
                        </span>
                        <Tag color={categoryColors[item.category]} style={{ fontSize: 11, padding: '0 4px' }}>
                          {item.category}
                        </Tag>
                      </Space>
                    </div>
                  </div>
                  <FireOutlined style={{ color: index < 3 ? '#cf1322' : 'transparent' }} />
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 分类筛选 */}
      <div style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button
            type={selectedCategory === null ? 'primary' : 'default'}
            onClick={() => setSelectedCategory(null)}
            style={selectedCategory === null ? { background: '#3b82f6', borderColor: '#3b82f6' } : {}}
          >
            全部
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              type={selectedCategory === cat ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(cat)}
              icon={categoryIcons[cat]}
              style={selectedCategory === cat ? { background: categoryColors[cat], borderColor: categoryColors[cat] } : {}}
            >
              {cat}
            </Button>
          ))}
        </Space>
      </div>

      {/* FAQ列表 */}
      {filteredFAQs.length === 0 ? (
        <Empty description="未找到相关问题" />
      ) : (
        <Collapse
          accordion
          activeKey={activeKey}
          onChange={setActiveKey}
          style={{ background: 'transparent', border: 'none' }}
          items={filteredFAQs.map(item => ({
            key: String(item.id),
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <span style={{ color: categoryColors[item.category] }}>{categoryIcons[item.category]}</span>
                <span style={{ fontWeight: 600, flex: 1 }}>{item.question}</span>
                {item.isHot && (
                  <Tag color="red" style={{ fontSize: 11, marginLeft: 'auto' }}>
                    <FireOutlined style={{ marginRight: 2 }} />
                    热门
                  </Tag>
                )}
                {item.isRecommended && (
                  <Tag color="purple" style={{ fontSize: 11 }}>
                    <StarOutlined style={{ marginRight: 2 }} />
                    推荐
                  </Tag>
                )}
              </div>
            ),
            style: {
              marginBottom: 12,
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              overflow: 'hidden',
              background: '#fff',
            },
            children: (
              <div style={{ padding: '8px 0' }}>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                  {item.answer}
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    {item.tags.map(tag => (
                      <Tag key={tag} color="blue" style={{ borderRadius: 4 }}>{tag}</Tag>
                    ))}
                  </Space>
                  <Space size={16}>
                    <Tooltip title="点赞">
                      <Button
                        type="text"
                        size="small"
                        icon={<LikeOutlined style={{ color: likedItems.has(item.id) ? '#3b82f6' : '#999' }} />}
                        onClick={(e) => handleLike(item.id, e)}
                      >
                        {item.likes + (likedItems.has(item.id) ? 1 : 0)}
                      </Button>
                    </Tooltip>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      <EyeOutlined style={{ marginRight: 4 }} />
                      {item.views} 次浏览
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {item.createdAt}
                    </span>
                  </Space>
                </div>
              </div>
            ),
          }))}
        />
      )}

      {/* 底部提示 */}
      <div style={{ marginTop: 24, textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: 12 }}>
        <MessageOutlined style={{ fontSize: 24, color: '#3b82f6', marginBottom: 8 }} />
        <Paragraph style={{ margin: 0, color: 'var(--text-secondary)' }}>
          没找到答案？请前往
          <Button type="link" style={{ padding: '0 4px' }}>问题反馈</Button>
          提交你的问题，我们会尽快回复
        </Paragraph>
      </div>
    </div>
  );
};

export default FAQPanel;
