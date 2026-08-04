/**
 * 成果展示面板 - 整合前三个AI的结果
 * 功能：实施汇报、总结、成果展示、导出
 */

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Timeline,
  Tag,
  Button,
  Progress,
  Statistic,
  Badge,
  Empty,
  Space,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tooltip,
  Divider,
} from 'antd';
import {
  TrophyOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  BulbOutlined,
  ToolOutlined,
  CompassOutlined,
  StarOutlined,
  FireOutlined,
  RiseOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Line, Pie, Bar } from '@ant-design/charts';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

// 模拟成果数据
const resultsData = {
  explorer: [
    {
      id: 1,
      title: 'AI教育行业市场调研报告',
      date: '2024-01-15',
      status: '已完成',
      summary: '目标市场规模约50亿元，年增长率25%，政策环境良好',
      details: [
        '目标用户群体：内容创作者、教育工作者',
        '市场规模：约50亿元，年增长率25%',
        '政策环境：国家大力支持AI+教育，有税收优惠政策',
        '竞争格局：头部3家企业占据60%市场份额',
        '机会窗口：未来6-12个月是最佳进入期',
      ],
      tags: ['市场调研', 'AI教育'],
    },
    {
      id: 2,
      title: '竞品分析报告',
      date: '2024-02-01',
      status: '已完成',
      summary: '分析3家主要竞品，找到差异化竞争策略',
      details: [
        '竞品A：市场份额35%，优势在品牌知名度',
        '竞品B：技术领先，但价格较高',
        '我们的优势：AI工具集成度高，性价比优',
        '差异化策略：聚焦垂直领域，提供定制化服务',
      ],
      tags: ['竞品分析', '策略'],
    },
  ],
  sage: [
    {
      id: 1,
      title: '初创期创业规划报告',
      date: '2024-01-20',
      status: '已保存',
      summary: '完整的创业方案，包含融资规划和执行路线图',
      details: [
        '阶段定位：初创期，核心任务是验证商业模式',
        '融资规划：自有资金5万 + 天使轮50-100万',
        'AI工具栈：ChatGPT、Midjourney、Notion AI',
        '3个月路线图：MVP开发→用户验证→商业模式确认',
        '风险提醒：现金流是关键，控制支出',
      ],
      tags: ['创业规划', '融资'],
    },
    {
      id: 2,
      title: '成长期战略规划',
      date: '2024-03-01',
      status: '进行中',
      summary: '从0到1的快速扩张方案',
      details: [
        '规模化获客：建立可复制获客渠道',
        '团队搭建：核心团队3-5人',
        '产品迭代：基于数据快速优化',
        '收入目标：月收入突破10万',
      ],
      tags: ['战略规划', '增长'],
    },
  ],
  maker: [
    {
      id: 1,
      title: '知识付费创业工作台',
      date: '2024-02-15',
      status: '进行中',
      summary: '已确定课程主题，完成大纲制作，正在录制第一节课',
      progress: 60,
      tasks: [
        { name: '确定课程主题', done: true },
        { name: '制作课程大纲', done: true },
        { name: '录制第一节课', done: false },
        { name: '搭建销售渠道', done: false },
        { name: '建立学员社群', done: false },
      ],
    },
    {
      id: 2,
      title: '内容创作IP计划',
      date: '2024-03-10',
      status: '进行中',
      summary: '已确定内容定位，制定内容计划，制作第一条内容',
      progress: 40,
      tasks: [
        { name: '确定内容定位', done: true },
        { name: '制定内容计划', done: true },
        { name: '制作第一条内容', done: false },
        { name: '选择发布平台', done: false },
        { name: '持续更新运营', done: false },
      ],
    },
  ],
};

// 进度趋势数据
const progressTrendData = [
  { month: '1月', explorer: 20, sage: 10, maker: 0 },
  { month: '2月', explorer: 80, sage: 40, maker: 20 },
  { month: '3月', explorer: 100, sage: 70, maker: 50 },
];

const ResultsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const { Text, Title, Paragraph } = require('antd').Typography;

  // 汇总统计
  const totalReports = resultsData.explorer.length + resultsData.sage.length;
  const totalProjects = resultsData.maker.length;
  const completedProjects = resultsData.maker.filter(p => p.progress === 100).length;
  const overallProgress = Math.round(
    resultsData.maker.reduce((acc, curr) => acc + curr.progress, 0) / resultsData.maker.length
  );

  // 图表配置
  const lineConfig = {
    data: progressTrendData.map(item => ({
      month: item.month,
      value: item.explorer,
      type: '探路者AI',
    })).concat(progressTrendData.map(item => ({
      month: item.month,
      value: item.sage,
      type: '军师AI',
    }))).concat(progressTrendData.map(item => ({
      month: item.month,
      value: item.maker,
      type: '工匠AI',
    }))),
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: ['#3b82f6', '#a855f7', '#f59e0b'],
    height: 250,
  };

  const pieConfig = {
    data: [
      { type: '探路者AI', value: resultsData.explorer.length },
      { type: '军师AI', value: resultsData.sage.length },
      { type: '工匠AI', value: resultsData.maker.length },
    ],
    angleField: 'value',
    colorField: 'type',
    color: ['#3b82f6', '#a855f7', '#f59e0b'],
    radius: 0.8,
    height: 250,
    label: {
      type: 'inner',
      offset: '-30%',
      content: '{value}个',
      style: { fontSize: 14, textAlign: 'center' },
    },
  };

  const handleExport = (format: string) => {
    message.success(`报告已导出为${format}格式`);
    setIsExportModalOpen(false);
  };

  const handleViewDetail = (result: any) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  // 渲染探路者AI成果
  const renderExplorerResults = () => (
    <div>
      {resultsData.explorer.map(item => (
        <Card key={item.id} style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <Title level={5} style={{ margin: '0 0 8px' }}>
                <CompassOutlined style={{ marginRight: 8, color: '#3b82f6' }} />
                {item.title}
              </Title>
              <Space>
                <Tag color="blue">探路者AI</Tag>
                <Tag color="success">{item.status}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
              </Space>
            </div>
            <Space>
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(item)}>查看</Button>
              <Button type="text" icon={<DownloadOutlined />} onClick={() => setIsExportModalOpen(true)}>导出</Button>
            </Space>
          </div>
          <Paragraph style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{item.summary}</Paragraph>
          <div>
            {item.tags.map(tag => (
              <Tag key={tag} style={{ marginRight: 8 }}>{tag}</Tag>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  // 渲染军师AI成果
  const renderSageResults = () => (
    <div>
      {resultsData.sage.map(item => (
        <Card key={item.id} style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <Title level={5} style={{ margin: '0 0 8px' }}>
                <BulbOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                {item.title}
              </Title>
              <Space>
                <Tag color="purple">军师AI</Tag>
                <Tag color={item.status === '已完成' ? 'success' : 'processing'}>{item.status}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
              </Space>
            </div>
            <Space>
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(item)}>查看</Button>
              <Button type="text" icon={<DownloadOutlined />} onClick={() => setIsExportModalOpen(true)}>导出</Button>
            </Space>
          </div>
          <Paragraph style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{item.summary}</Paragraph>
          <div>
            {item.tags.map(tag => (
              <Tag key={tag} style={{ marginRight: 8 }}>{tag}</Tag>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  // 渲染工匠AI成果
  const renderMakerResults = () => (
    <div>
      {resultsData.maker.map(item => (
        <Card key={item.id} style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <Title level={5} style={{ margin: '0 0 8px' }}>
                <ToolOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
                {item.title}
              </Title>
              <Space>
                <Tag color="orange">工匠AI</Tag>
                <Tag color="processing">{item.status}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
              </Space>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text strong style={{ color: '#a855f7', fontSize: 24 }}>{item.progress}%</Text>
            </div>
          </div>
          <Paragraph style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{item.summary}</Paragraph>
          <Progress percent={item.progress} strokeColor="#a855f7" style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {item.tasks.map((task: any, idx: number) => (
              <Tag
                key={idx}
                icon={task.done ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                color={task.done ? 'success' : 'default'}
                style={{ borderRadius: 6 }}
              >
                {task.name}
              </Tag>
            ))}
          </div>
          <Divider />
          <Space>
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(item)}>查看详情</Button>
            <Button type="text" icon={<DownloadOutlined />} onClick={() => setIsExportModalOpen(true)}>导出报告</Button>
          </Space>
        </Card>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
          <TrophyOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
          成果展示
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>整合前三个AI的实施汇报和总结</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #3b82f615 0%, #3b82f605 100%)', border: '1px solid #3b82f620' }}>
            <Statistic
              title="调研报告"
              value={resultsData.explorer.length}
              styles={{ content: { color: '#3b82f6', fontSize: 28, fontWeight: 700 } }}
              prefix={<CompassOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #a855f715 0%, #a855f705 100%)', border: '1px solid #a855f720' }}>
            <Statistic
              title="规划报告"
              value={resultsData.sage.length}
              styles={{ content: { color: '#a855f7', fontSize: 28, fontWeight: 700 } }}
              prefix={<BulbOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b15 0%, #f59e0b05 100%)', border: '1px solid #f59e0b20' }}>
            <Statistic
              title="创业项目"
              value={totalProjects}
              styles={{ content: { color: '#f59e0b', fontSize: 28, fontWeight: 700 } }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #10b98115 0%, #10b98105 100%)', border: '1px solid #10b98120' }}>
            <Statistic
              title="总体进度"
              value={overallProgress}
              suffix="%"
              styles={{ content: { color: '#10b981', fontSize: 28, fontWeight: 700 } }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="各AI进度趋势" style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="成果分布" style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>

      {/* 成果列表 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        <TabPane tab={<span><CompassOutlined /> 探路者AI成果</span>} key="explorer">
          {renderExplorerResults()}
        </TabPane>
        <TabPane tab={<span><BulbOutlined /> 军师AI成果</span>} key="sage">
          {renderSageResults()}
        </TabPane>
        <TabPane tab={<span><ToolOutlined /> 工匠AI成果</span>} key="maker">
          {renderMakerResults()}
        </TabPane>
        <TabPane tab={<span><FileTextOutlined /> 汇总报告</span>} key="summary">
          <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              <FileTextOutlined style={{ marginRight: 8, color: '#a855f7' }} />
              创业实施汇总报告
            </Title>
            <Timeline
              items={[
                {
                  icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
                  color: 'green',
                  content: (
                    <div>
                      <Text strong>市场调研完成</Text>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>通过探路者AI完成行业调研，确定目标市场和竞争策略</div>
                    </div>
                  ),
                },
                {
                  icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
                  color: 'green',
                  content: (
                    <div>
                      <Text strong>创业规划制定</Text>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>通过军师AI制定完整的创业规划，包含融资和执行方案</div>
                    </div>
                  ),
                },
                {
                  icon: <ClockCircleOutlined style={{ color: '#f59e0b' }} />,
                  color: 'orange',
                  content: (
                    <div>
                      <Text strong>项目执行中</Text>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>通过工匠AI工作台推进项目，当前进度 {overallProgress}%</div>
                    </div>
                  ),
                },
                {
                  icon: <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d9d9d9' }} />,
                  color: 'gray',
                  content: (
                    <div>
                      <Text strong>成果变现</Text>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>预计下一阶段实现收入突破</div>
                    </div>
                  ),
                },
              ]}
            />
            <Divider />
            <Space>
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => setIsExportModalOpen(true)} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
                导出汇总报告
              </Button>
              <Button icon={<ShareAltOutlined />}>分享</Button>
              <Button icon={<PrinterOutlined />}>打印</Button>
            </Space>
          </Card>
        </TabPane>
      </Tabs>

      {/* 导出弹窗 */}
      <Modal
        title="导出报告"
        open={isExportModalOpen}
        onCancel={() => setIsExportModalOpen(false)}
        footer={null}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button block icon={<FileTextOutlined />} onClick={() => handleExport('PDF')}>
            导出为PDF
          </Button>
          <Button block icon={<FileTextOutlined />} onClick={() => handleExport('Word')}>
            导出为Word
          </Button>
          <Button block icon={<FileTextOutlined />} onClick={() => handleExport('Excel')}>
            导出为Excel
          </Button>
        </Space>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="成果详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>关闭</Button>,
          <Button key="export" type="primary" icon={<DownloadOutlined />} onClick={() => setIsExportModalOpen(true)} style={{ background: '#a855f7', borderColor: '#a855f7' }}>
            导出
          </Button>,
        ]}
      >
        {selectedResult && (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>{selectedResult.title}</Title>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="blue">{selectedResult.date}</Tag>
              <Tag color="success">{selectedResult.status}</Tag>
            </Space>
            <Paragraph style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{selectedResult.summary}</Paragraph>
            {selectedResult.details && (
              <ul style={{ paddingLeft: 20 }}>
                {selectedResult.details.map((detail: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>{detail}</li>
                ))}
              </ul>
            )}
            {selectedResult.tasks && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>任务进度</Text>
                <Progress percent={selectedResult.progress} strokeColor="#a855f7" />
                <div style={{ marginTop: 12 }}>
                  {selectedResult.tasks.map((task: any, idx: number) => (
                    <Tag
                      key={idx}
                      icon={task.done ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      color={task.done ? 'success' : 'default'}
                      style={{ margin: '0 8px 8px 0' }}
                    >
                      {task.name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResultsPanel;
