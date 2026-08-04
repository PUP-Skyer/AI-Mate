import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Tag,
  Progress,
  Timeline,
  Form,
  Radio,
  Checkbox,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  Steps,
  Typography,
  Space,
  Badge,
  Tooltip,
  Avatar,
  Empty,
  Segmented,
} from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  SaveOutlined,
  FileTextOutlined,
  ToolOutlined,
  RocketOutlined,
  DeleteOutlined,
  PlusOutlined,
  BulbOutlined,
  AimOutlined,
  CalendarOutlined,
  FlagOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  RiseOutlined,
  FallOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface WorkBoardProps {
  category: {
    key: string;
    title: string;
    subtitle: string;
    color: string;
    items: { name: string; examples: string[] }[];
  };
  onClose: () => void;
}

// 模拟数据可视化组件
const CircularProgress: React.FC<{ percent: number; color: string; size?: number }> = ({ percent, color, size = 80 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <Text strong style={{ fontSize: 18, color }}>{percent}%</Text>
      </div>
    </div>
  );
};

// 条形图组件
const BarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((item, index) => (
        <div key={index}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12 }}>{item.label}</Text>
            <Text strong style={{ fontSize: 12 }}>{item.value}</Text>
          </div>
          <div style={{
            height: 8,
            background: '#f0f0f0',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(item.value / maxValue) * 100}%`,
              background: item.color,
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const WorkBoard: React.FC<WorkBoardProps> = ({ category, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [tasks, setTasks] = useState<{ id: number; text: string; done: boolean; priority: 'high' | 'medium' | 'low' }[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState([
    { id: 1, text: '项目启动', done: true, date: new Date().toLocaleDateString('zh-CN') },
    { id: 2, text: '服务类型确定', done: false, date: '' },
    { id: 3, text: '第一个客户', done: false, date: '' },
    { id: 4, text: '收入破万', done: false, date: '' },
  ]);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // 根据分类生成默认任务
  const getDefaultTasks = () => {
    const defaults: Record<string, string[]> = {
      consulting: ['确定咨询细分领域', '制作服务介绍页', '定价策略制定', '获取第一个客户', '建立案例库'],
      education: ['确定课程主题', '制作课程大纲', '录制第一节课', '搭建销售渠道', '建立学员社群'],
      digital: ['确定产品方向', '制作产品原型', '开发最小可行产品', '上线测试', '推广获客'],
      content: ['确定内容定位', '制定内容计划', '制作第一条内容', '选择发布平台', '持续更新运营'],
      design: ['确定服务类型', '制作作品集', '定价策略', '获取第一个客户', '建立口碑'],
      tech: ['确定技术栈', '搭建开发环境', '完成核心功能', '测试部署', '交付客户'],
      ecommerce: ['选品调研', '寻找供应商', '搭建店铺', '上架商品', '推广运营'],
      local: ['确定服务范围', '制作宣传物料', '获取第一个客户', '建立服务流程', '口碑传播'],
      other: ['确定服务方向', '制作服务介绍', '定价策略', '获取客户', '优化服务'],
    };
    return (defaults[category.key] || defaults.other).map((text, i) => ({
      id: i + 1,
      text,
      done: false,
      priority: i < 2 ? 'high' as const : i < 4 ? 'medium' as const : 'low' as const,
    }));
  };

  // 初始化任务
  React.useEffect(() => {
    setTasks(getDefaultTasks());
  }, [category.key]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false, priority: newTaskPriority }]);
    setNewTask('');
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleMilestone = (id: number) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, done: !m.done, date: !m.done ? new Date().toLocaleDateString('zh-CN') : '' } : m
    ));
  };

  const completedCount = tasks.filter(t => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.done).length;
  const mediumPriorityCount = tasks.filter(t => t.priority === 'medium' && !t.done).length;
  const lowPriorityCount = tasks.filter(t => t.priority === 'low' && !t.done).length;

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const priorityLabels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };

  const steps = [
    { title: '项目设定', icon: <EditOutlined />, content: '设定项目信息' },
    { title: '服务选择', icon: <ToolOutlined />, content: '选择服务类型' },
    { title: '任务管理', icon: <CheckCircleOutlined />, content: '管理任务进度' },
    { title: '执行记录', icon: <FileTextOutlined />, content: '记录执行情况' },
  ];

  // 项目设定 - 可视化引导
  const renderProjectSetup = () => (
    <div>
      <Row gutter={24}>
        <Col span={16}>
          <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0' }}>
            <Alert
              title={`欢迎使用${category.title}工作台`}
              description="设定你的项目信息，开启创业之旅"
              type="info"
              showIcon
              icon={<BulbOutlined />}
              style={{ marginBottom: 24, borderRadius: 12, border: 'none', background: '#f0f7ff' }}
            />
            <Form layout="vertical">
              <Form.Item label={<Text strong>项目名称</Text>} required>
                <Input
                  size="large"
                  placeholder="例如：AI职场咨询工作台"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  prefix={<RocketOutlined style={{ color: category.color }} />}
                  style={{ borderRadius: 10, height: 48 }}
                />
              </Form.Item>
              <Form.Item label={<Text strong>创业方向</Text>}>
                <Input size="large" disabled value={category.title} style={{ borderRadius: 10, height: 48, background: '#fafafa' }} />
              </Form.Item>
              <Form.Item label={<Text strong>目标描述</Text>}>
                <TextArea
                  size="large"
                  placeholder="描述你的创业目标和愿景，例如：3个月内获取10个付费客户，月收入达5万元..."
                  rows={4}
                  value={projectGoal}
                  onChange={e => setProjectGoal(e.target.value)}
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setActiveStep(1)}
                  disabled={!projectName}
                  style={{
                    background: category.color,
                    borderColor: category.color,
                    borderRadius: 10,
                    height: 48,
                    padding: '0 32px',
                  }}
                >
                  下一步<ArrowRightOutlined />
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={8}>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', background: '#ffffff' }}>
              <div style={{ textAlign: 'center' }}>
                <CrownOutlined style={{ fontSize: 32, color: category.color, marginBottom: 12 }} />
                <Title level={5} style={{ margin: '0 0 8px' }}>创业小贴士</Title>
                <Paragraph style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  一个好的项目名称应该简洁、易记、能体现核心价值
                </Paragraph>
              </div>
            </Card>
            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', background: '#ffffff' }}>
              <div style={{ textAlign: 'center' }}>
                <ThunderboltOutlined style={{ fontSize: 32, color: '#f59e0b', marginBottom: 12 }} />
                <Title level={5} style={{ margin: '0 0 8px' }}>目标设定</Title>
                <Paragraph style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  建议设定SMART目标：具体、可衡量、可达成、相关性强、有时限
                </Paragraph>
              </div>
            </Card>
            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', background: '#ffffff' }}>
              <div style={{ textAlign: 'center' }}>
                <RiseOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 12 }} />
                <Title level={5} style={{ margin: '0 0 8px' }}>成功路径</Title>
                <Paragraph style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  从设定目标开始，逐步实现你的创业梦想
                </Paragraph>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );

  // 服务选择 - 卡片可视化
  const renderServiceSelection = () => (
    <div>
      <Alert
        title="选择你的服务类型"
        description="从以下细分领域中选择你计划提供的服务"
        type="info"
        showIcon
        icon={<AimOutlined />}
        style={{ marginBottom: 24, borderRadius: 12, border: 'none', background: '#f0f7ff' }}
      />

      <Row gutter={[16, 16]}>
        {category.items.map((item, index) => (
          <Col span={12} key={item.name}>
            <Card
              hoverable
              onClick={() => setSelectedService(item.name)}
              style={{
                borderRadius: 16,
                border: selectedService === item.name ? `2px solid ${category.color}` : '1px solid #f0f0f0',
                background: selectedService === item.name ? `${category.color}08` : '#fff',
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.3s ease',
              }}
              styles={{ body: { padding: '20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: selectedService === item.name ? category.color : `${category.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: selectedService === item.name ? '#fff' : category.color,
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}>
                  {index % 4 === 0 ? <StarOutlined /> : index % 4 === 1 ? <FireOutlined /> : index % 4 === 2 ? <ThunderboltOutlined /> : <CrownOutlined />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                    {selectedService === item.name && <CheckCircleOutlined style={{ color: category.color }} />}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.examples.slice(0, 3).join('、')}
                    </Text>
                  </div>
                  <div>
                    {item.examples.map((ex, idx) => (
                      <Tag
                        key={idx}
                        size="small"
                        style={{
                          margin: '0 6px 6px 0',
                          background: selectedService === item.name ? `${category.color}15` : '#f5f5f5',
                          borderColor: selectedService === item.name ? `${category.color}30` : '#e8e8e8',
                          color: selectedService === item.name ? category.color : '#666',
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      >
                        {ex}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button size="large" onClick={() => setActiveStep(0)} icon={<ArrowLeftOutlined />} style={{ borderRadius: 10, height: 44 }}>
          上一步
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={() => setActiveStep(2)}
          disabled={!selectedService}
          style={{
            background: category.color,
            borderColor: category.color,
            borderRadius: 10,
            height: 44,
            padding: '0 32px',
          }}
        >
          下一步<ArrowRightOutlined />
        </Button>
      </div>
    </div>
  );

  // 任务管理 - 看板视图 + 统计图表
  const renderTaskManagement = () => {
    const todoTasks = tasks.filter(t => !t.done);
    const doneTasks = tasks.filter(t => t.done);

    const priorityData = [
      { label: '高优先级', value: highPriorityCount, color: '#ef4444' },
      { label: '中优先级', value: mediumPriorityCount, color: '#f59e0b' },
      { label: '低优先级', value: lowPriorityCount, color: '#10b981' },
    ];

    return (
      <div>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ borderRadius: 16, background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`, border: `1px solid ${category.color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <CircularProgress percent={progress} color={category.color} size={60} />
                <div>
                  <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>完成进度</Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: category.color }}>{progress}%</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 16, background: '#f0fdf4', border: '1px solid #86efac20' }}>
              <Statistic
                title={<Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已完成</Text>}
                value={completedCount}
                suffix={`/ ${tasks.length}`}
                styles={{ content: {} }}
              />
              <Progress percent={tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0} strokeColor="#10b981" showInfo={false} size="small" />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 16, background: '#fef3c7', border: '1px solid #fcd34d20' }}>
              <Statistic
                title={<Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>待办任务</Text>}
                value={todoTasks.length}
                styles={{ content: {} }}
              />
              <div style={{ marginTop: 8 }}>
                <BarChart data={priorityData} />
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 16, background: '#eff6ff', border: '1px solid #93c5fd20' }}>
              <Statistic
                title={<Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>效率指数</Text>}
                value={tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}
                suffix="分"
                styles={{ content: {} }}
              />
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FireOutlined style={{ color: '#f59e0b' }} />
                  <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {progress >= 80 ? '效率极高' : progress >= 50 ? '效率良好' : progress >= 20 ? '继续努力' : '刚开始'}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 任务列表 */}
        <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <Title level={5} style={{ margin: '0 0 4px' }}>
                <CheckSquareOutlined style={{ marginRight: 8, color: category.color }} />
                任务清单
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>管理你的创业任务，追踪进度</Text>
            </div>
            <Segmented
              options={[
                { label: '列表视图', value: 'list' },
                { label: '看板视图', value: 'board' },
              ]}
              value={viewMode}
              onChange={setViewMode}
            />
          </div>

          {viewMode === 'list' ? (
            <div>
              {tasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    marginBottom: 8,
                    background: task.done ? '#f6ffed' : '#fafafa',
                    border: `1px solid ${task.done ? '#b7eb8f' : '#f0f0f0'}`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <Checkbox
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <Text
                        style={{
                          textDecoration: task.done ? 'line-through' : 'none',
                          color: task.done ? '#999' : '#333',
                          fontSize: 14,
                        }}
                      >
                        {task.text}
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag
                          size="small"
                          style={{
                            background: `${priorityColors[task.priority]}15`,
                            borderColor: `${priorityColors[task.priority]}30`,
                            color: priorityColors[task.priority],
                            fontSize: 11,
                            borderRadius: 4,
                          }}
                        >
                          {priorityLabels[task.priority]}
                        </Tag>
                      </div>
                    </div>
                    <Tooltip title="删除任务">
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeTask(task.id)}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Row gutter={16}>
              <Col span={12}>
                <Card title="待办" style={{ borderRadius: 12, background: '#fff7e6', border: '1px solid #ffd591' }}>
                  {todoTasks.length === 0 ? (
                    <Empty description="暂无待办任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      {todoTasks.map(task => (
                        <Card
                          key={task.id}
                          size="small"
                          style={{
                            borderRadius: 8,
                            border: `1px solid ${priorityColors[task.priority]}30`,
                            background: `${priorityColors[task.priority]}08`,
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleTask(task.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: priorityColors[task.priority],
                            }} />
                            <Text style={{ fontSize: 13 }}>{task.text}</Text>
                          </div>
                        </Card>
                      ))}
                    </Space>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="已完成" style={{ borderRadius: 12, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  {doneTasks.length === 0 ? (
                    <Empty description="暂无已完成任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      {doneTasks.map(task => (
                        <Card
                          key={task.id}
                          size="small"
                          style={{
                            borderRadius: 8,
                            border: '1px solid #b7eb8f',
                            background: '#f6ffed',
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleTask(task.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <Text style={{ fontSize: 13, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{task.text}</Text>
                          </div>
                        </Card>
                      ))}
                    </Space>
                  )}
                </Card>
              </Col>
            </Row>
          )}

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Input
              placeholder="添加新任务..."
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onPressEnter={addTask}
              style={{ borderRadius: 10, height: 40 }}
              prefix={<PlusOutlined style={{ color: 'var(--text-muted)' }} />}
            />
            <Radio.Group
              value={newTaskPriority}
              onChange={e => setNewTaskPriority(e.target.value)}
              size="small"
            >
              <Radio.Button value="high" style={{ color: '#ef4444' }}>高</Radio.Button>
              <Radio.Button value="medium" style={{ color: '#f59e0b' }}>中</Radio.Button>
              <Radio.Button value="low" style={{ color: '#10b981' }}>低</Radio.Button>
            </Radio.Group>
            <Button
              type="primary"
              onClick={addTask}
              style={{ background: category.color, borderColor: category.color, borderRadius: 10, height: 40 }}
            >
              添加
            </Button>
          </div>
        </Card>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Button size="large" onClick={() => setActiveStep(1)} icon={<ArrowLeftOutlined />} style={{ borderRadius: 10, height: 44 }}>
            上一步
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={() => setActiveStep(3)}
            style={{
              background: category.color,
              borderColor: category.color,
              borderRadius: 10,
              height: 44,
              padding: '0 32px',
            }}
          >
            下一步<ArrowRightOutlined />
          </Button>
        </div>
      </div>
    );
  };

  // 执行记录 - 时间线 + 数据可视化
  const renderExecutionRecord = () => {
    const completedMilestones = milestones.filter(m => m.done).length;
    const milestoneProgress = Math.round((completedMilestones / milestones.length) * 100);

    return (
      <div>
        <Alert
          title="执行记录与里程碑"
          description="记录你的创业过程，标记关键里程碑"
          type="info"
          showIcon
          icon={<TrophyOutlined />}
          style={{ marginBottom: 24, borderRadius: 12, border: 'none', background: '#f0f7ff' }}
        />

        <Row gutter={24}>
          <Col span={16}>
            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 20 }}>
                <FileTextOutlined style={{ marginRight: 8, color: category.color }} />
                项目进展记录
              </Title>
              <TextArea
                placeholder="记录今天的进展、遇到的问题、解决方案、心得体会..."
                rows={8}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ borderRadius: 12, marginBottom: 16 }}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => alert('记录已保存')}
                style={{ background: category.color, borderColor: category.color, borderRadius: 10, height: 40 }}
              >
                保存记录
              </Button>
            </Card>

            <Card style={{ borderRadius: 16, background: '#fafafa', border: '1px solid #f0f0f0' }}>
              <Title level={5} style={{ marginBottom: 20 }}>
                <TrophyOutlined style={{ marginRight: 8, color: category.color }} />
                项目概览
              </Title>
              <Row gutter={24}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: 12 }}>
                    <RocketOutlined style={{ fontSize: 24, color: category.color, marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>项目名称</div>
                    <Text strong style={{ fontSize: 16 }}>{projectName || '未设置'}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: 12 }}>
                    <StarOutlined style={{ fontSize: 24, color: '#f59e0b', marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>服务类型</div>
                    <Text strong style={{ fontSize: 16 }}>{selectedService || '未选择'}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: 12 }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#10b981', marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>任务完成</div>
                    <Text strong style={{ fontSize: 16, color: category.color }}>
                      {completedCount}/{tasks.length}
                    </Text>
                  </div>
                </Col>
              </Row>
              <Divider />
              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: 12 }}>
                <FlagOutlined style={{ fontSize: 24, color: '#3b82f6', marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>项目目标</div>
                <Paragraph style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {projectGoal || '暂无目标描述'}
                </Paragraph>
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title level={5} style={{ margin: 0 }}>
                  <FlagOutlined style={{ marginRight: 8, color: category.color }} />
                  关键里程碑
                </Title>
                <CircularProgress percent={milestoneProgress} color={category.color} size={50} />
              </div>
              <Timeline
                items={milestones.map(m => ({
                  icon: m.done ? (
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CheckCircleOutlined style={{ color: '#fff', fontSize: 16 }} />
                    </div>
                  ) : (
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <ClockCircleOutlined style={{ color: 'var(--text-muted)', fontSize: 16 }} />
                    </div>
                  ),
                  color: m.done ? 'green' : 'gray',
                  content: (
                    <div
                      style={{
                        cursor: 'pointer',
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: m.done ? '#f0fdf4' : '#fafafa',
                        border: m.done ? '1px solid #86efac' : '1px solid #f0f0f0',
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => toggleMilestone(m.id)}
                    >
                      <Text strong style={{ color: m.done ? '#10b981' : '#333', fontSize: 14 }}>{m.text}</Text>
                      {m.date && (
                        <div style={{ marginTop: 8 }}>
                          <Tag size="small" color="success" style={{ borderRadius: 4 }}>
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            {m.date}
                          </Tag>
                        </div>
                      )}
                      {!m.done && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>点击标记完成</Text>
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            </Card>

            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0' }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                <BarChartOutlined style={{ marginRight: 8, color: category.color }} />
                任务统计
              </Title>
              <BarChart
                data={[
                  { label: '已完成', value: completedCount, color: '#10b981' },
                  { label: '待办', value: tasks.length - completedCount, color: '#f59e0b' },
                  { label: '高优先级', value: highPriorityCount, color: '#ef4444' },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button size="large" onClick={() => setActiveStep(2)} icon={<ArrowLeftOutlined />} style={{ borderRadius: 10, height: 44 }}>
            上一步
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={onClose}
            style={{
              background: category.color,
              borderColor: category.color,
              borderRadius: 10,
              height: 44,
              padding: '0 32px',
            }}
          >
            完成并关闭
          </Button>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return renderProjectSetup();
      case 1: return renderServiceSelection();
      case 2: return renderTaskManagement();
      case 3: return renderExecutionRecord();
      default: return null;
    }
  };

  return (
    <div style={{ padding: '24px', maxHeight: '85vh', overflow: 'auto' }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: '20px 24px',
        background: `linear-gradient(135deg, ${category.color}10 0%, ${category.color}05 100%)`,
        borderRadius: 16,
        border: `1px solid ${category.color}20`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            color: '#fff',
            boxShadow: `0 4px 14px ${category.color}40`,
          }}>
            <ToolOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 20 }}>
              {category.title}工作台
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>{category.subtitle}</Text>
          </div>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{ fontSize: 16 }}
        />
      </div>

      {/* 步骤条 */}
      <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', marginBottom: 24 }}>
        <Steps
          current={activeStep}
          onChange={setActiveStep}
          items={steps}
          style={{ padding: '8px 0' }}
        />
      </Card>

      {/* 内容区域 */}
      {renderStepContent()}
    </div>
  );
};

export default WorkBoard;
