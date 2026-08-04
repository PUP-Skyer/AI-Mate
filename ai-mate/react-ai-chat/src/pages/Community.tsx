/**
 * 社区页面
 */

import React, { useState } from 'react';
import { Card, Avatar, Button, Input, Tabs, Badge, Space, Tag, Statistic, Row, Col } from 'antd';
import { PlusOutlined, MessageOutlined, LikeOutlined, ExportOutlined, TeamOutlined, CalendarOutlined, QuestionCircleOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const postsData = [
  {
    id: '1',
    title: '如何有效利用AI工具提升企业运营效率',
    content: '随着AI技术的快速发展，越来越多的企业开始尝试将AI工具应用到日常运营中。本文将分享几个实用的AI工具及其应用场景...',
    author: '运营专家',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20person%20avatar%2C%20simple%20style&image_size=square',
    time: '2小时前',
    likes: 42,
    comments: 18,
    views: 256,
    tags: ['AI工具', '运营效率', '企业管理'],
  },
  {
    id: '2',
    title: '2026年创业趋势分析',
    content: '基于最新的数据和市场研究，我们对2026年的创业趋势进行了分析。主要趋势包括AI驱动的创业、可持续发展、远程工作等...',
    author: '市场分析师',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=market%20analyst%20avatar%2C%20professional%20style&image_size=square',
    time: '5小时前',
    likes: 78,
    comments: 32,
    views: 412,
    tags: ['创业趋势', '市场分析', '2026'],
  },
  {
    id: '3',
    title: '融资经验分享：如何获得天使投资',
    content: '作为一名连续创业者，我经历了多次融资过程。在此分享一些获得天使投资的经验和技巧，希望对正在融资的创业者有所帮助...',
    author: '连续创业者',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=serial%20entrepreneur%20avatar%2C%20confident%20style&image_size=square',
    time: '1天前',
    likes: 124,
    comments: 56,
    views: 689,
    tags: ['融资', '天使投资', '创业经验'],
  },
  {
    id: '4',
    title: '技术选型：如何选择适合自己项目的技术栈',
    content: '技术选型是项目成功的关键因素之一。本文将从项目需求、团队技能、性能要求等多个维度，分享技术选型的方法和注意事项...',
    author: '技术总监',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=technical%20director%20avatar%2C%20tech%20style&image_size=square',
    time: '2天前',
    likes: 89,
    comments: 41,
    views: 523,
    tags: ['技术选型', '技术栈', '项目管理'],
  },
];

const activitiesData = [
  {
    id: '1',
    title: 'AI创业峰会 2026',
    date: '2026-05-15',
    time: '09:00-18:00',
    location: '北京国际会议中心',
    organizer: 'AI创业联盟',
    participants: 500,
    status: 'upcoming',
  },
  {
    id: '2',
    title: '融资路演专场',
    date: '2026-04-30',
    time: '14:00-17:00',
    location: '上海张江高科技园区',
    organizer: '创业者协会',
    participants: 150,
    status: 'upcoming',
  },
  {
    id: '3',
    title: '技术分享会：AI大模型应用',
    date: '2026-04-28',
    time: '19:00-21:00',
    location: '线上直播',
    organizer: '技术社区',
    participants: 800,
    status: 'upcoming',
  },
];

const qaData = [
  {
    id: '1',
    question: '如何提高创业项目的融资成功率？',
    answer: '提高融资成功率的关键在于：1. 有清晰的商业模式和盈利模式；2. 展示团队的执行力和专业背景；3. 有数据支持的市场分析；4. 合理的估值和融资计划；5. 与投资人的有效沟通。',
    expert: '投资专家',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=investment%20expert%20avatar%2C%20professional%20style&image_size=square',
    time: '1天前',
    likes: 45,
  },
  {
    id: '2',
    question: '初创公司如何建立有效的团队文化？',
    answer: '建立团队文化的关键：1. 明确使命和价值观；2. 以身作则，领导者带头践行；3. 建立开放的沟通机制；4. 认可和奖励符合文化的行为；5. 在招聘中重视文化匹配度。',
    expert: '人力资源专家',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=HR%20expert%20avatar%2C%20professional%20style&image_size=square',
    time: '2天前',
    likes: 32,
  },
  {
    id: '3',
    question: '如何评估一个创业项目的市场潜力？',
    answer: '评估市场潜力的方法：1. TAM/SAM/SOM市场规模分析；2. 行业增长率和趋势研究；3. 竞争对手分析和差异化定位；4. 用户需求验证和痛点分析；5. 商业模式可行性评估。',
    expert: '市场研究专家',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=market%20research%20expert%20avatar%2C%20professional%20style&image_size=square',
    time: '3天前',
    likes: 28,
  },
];

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  time: string;
  likes: number;
  comments: number;
  views: number;
  tags: string[];
}

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>(postsData);

  const handlePublish = () => {
    if (!newPost.trim()) return;

    const newPostItem: Post = {
      id: Date.now().toString(),
      title: newPost.slice(0, 50) + (newPost.length > 50 ? '...' : ''),
      content: newPost,
      author: '我',
      avatar: '',
      time: '刚刚',
      likes: 0,
      comments: 0,
      views: 0,
      tags: ['新发布'],
    };

    setPosts([newPostItem, ...posts]);
    setNewPost('');
  };

  const postsItems = posts.map((item) => (
    <Card
      key={item.id}
      hoverable
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s',
      }}
      styles={{ body: { padding: '20px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Avatar src={item.avatar} alt={item.author} size={48} />
        <div style={{ marginLeft: 12 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1a1a2e' }}>{item.author}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.time}</div>
        </div>
      </div>
      <h3 style={{ marginBottom: 12, fontSize: 18, color: '#1a1a2e' }}>{item.title}</h3>
      <p style={{ marginBottom: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.content}</p>
      <div style={{ marginBottom: 16 }}>
        <Space>
          {item.tags.map((tag, index) => (
            <Tag
              key={index}
              color="blue"
              style={{ borderRadius: 4, padding: '4px 8px' }}
            >
              {tag}
            </Tag>
          ))}
        </Space>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTop: '1px solid #f0f0f0',
      }}>
        <Space size="large">
          <Button
            icon={<LikeOutlined />}
            type="text"
            style={{ color: 'var(--text-secondary)' }}
          >
            {item.likes}
          </Button>
          <Button
            icon={<MessageOutlined />}
            type="text"
            style={{ color: 'var(--text-secondary)' }}
          >
            {item.comments}
          </Button>
          <Button
            icon={<ExportOutlined />}
            type="text"
            style={{ color: 'var(--text-secondary)' }}
          >
            分享
          </Button>
        </Space>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <EyeOutlined /> {item.views} 浏览
        </span>
      </div>
    </Card>
  ));

  const activitiesItems = activitiesData.map((item) => (
    <Card
      key={item.id}
      hoverable
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
      styles={{ body: { padding: '20px' } }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: '1px solid #f0f0f0',
      }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>{item.title}</h3>
        <Badge
          status={item.status === 'upcoming' ? 'processing' : 'default'}
          text={item.status === 'upcoming' ? '即将开始' : '已结束'}
          style={{ fontSize: 14 }}
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#333' }}>时间：</strong>
          <span>{item.date} {item.time}</span>
        </p>
        <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#333' }}>地点：</strong>
          <span>{item.location}</span>
        </p>
        <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#333' }}>主办方：</strong>
          <span>{item.organizer}</span>
        </p>
        <p style={{ marginBottom: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#333' }}>参与人数：</strong>
          <span>{item.participants}人</span>
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          style={{
            borderRadius: 8,
            padding: '0 24px',
            height: 36,
          }}
        >
          报名参加
        </Button>
      </div>
    </Card>
  ));

  const qaItems = qaData.map((item) => (
    <Card
      key={item.id}
      hoverable
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
      styles={{ body: { padding: '20px' } }}
    >
      <h3 style={{
        marginBottom: 16,
        fontSize: 18,
        color: '#1a1a2e',
        paddingBottom: 16,
        borderBottom: '2px solid #e6f4ff',
      }}>
        {item.question}
      </h3>
      <div style={{
        background: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', marginBottom: 12 }}>
          <Avatar src={item.avatar} size={40} />
          <div style={{ marginLeft: 12, flex: 1 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e' }}>
              {item.expert}
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{item.answer}</p>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
              {item.time} · <LikeOutlined /> {item.likes}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          type="primary"
          style={{
            borderRadius: 8,
            padding: '0 20px',
            height: 36,
          }}
        >
          我要提问
        </Button>
        <Button
          icon={<LikeOutlined />}
          style={{
            borderRadius: 8,
            padding: '0 20px',
            height: 36,
          }}
        >
          赞同 ({item.likes})
        </Button>
      </div>
    </Card>
  ));

  const tabItems = [
    {
      key: 'posts',
      label: (
        <Space>
          <MessageOutlined />
          <span>讨论帖</span>
        </Space>
      ),
      children: <div>{postsItems}</div>,
    },
    {
      key: 'activities',
      label: (
        <Space>
          <CalendarOutlined />
          <span>活动</span>
        </Space>
      ),
      children: <div>{activitiesItems}</div>,
    },
    {
      key: 'qa',
      label: (
        <Space>
          <QuestionCircleOutlined />
          <span>专家问答</span>
        </Space>
      ),
      children: <div>{qaItems}</div>,
    },
  ];

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
      minHeight: '100vh',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        background: '#fff',
        padding: '20px 24px',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1a1a2e' }}>社区</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            分享经验、交流想法、与专家互动
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{
            borderRadius: 8,
            padding: '0 24px',
            height: 40,
          }}
        >
          发布帖子
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <MessageOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>帖子总数</span>}
              value={posts.length}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <CalendarOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>活动数</span>}
              value={activitiesData.length}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <QuestionCircleOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>问答数</span>}
              value={qaData.length}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <EyeOutlined style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <Statistic
              title={<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>总浏览量</span>}
              value={posts.reduce((sum, p) => sum + p.views, 0)}
              styles={{ content: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: '20px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <Avatar
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#1890ff',
              marginRight: 12,
            }}
          />
          <span style={{ fontWeight: 500, color: '#333' }}>分享你的想法</span>
        </div>
        <TextArea
          placeholder="分享你的想法、经验或问题..."
          rows={4}
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          style={{ borderRadius: 8 }}
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => setNewPost('')}
            style={{ borderRadius: 8, padding: '0 20px', height: 36 }}
          >
            取消
          </Button>
          <Button
            type="primary"
            onClick={handlePublish}
            disabled={!newPost.trim()}
            style={{
              marginLeft: 8,
              borderRadius: 8,
              padding: '0 24px',
              height: 36,
            }}
          >
            发布
          </Button>
        </div>
      </Card>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default Community;
