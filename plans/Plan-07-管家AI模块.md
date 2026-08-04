# 管家AI模块 实施计划

> **目标：** 实现管家AI的任务管理、进度跟踪、资源对接、团队协作四大核心功能，为大学生创业者提供项目全生命周期管理工具。
>
> **依赖：** Plan-01（项目基础架构）、Plan-02（API真实化）、Plan-03（AI模型集成）
>
> **技术栈：** React 19 + TypeScript + Ant Design 6 + Zustand + 智谱GLM流式接口 + localStorage持久化

---

## 模块概述

管家AI（ButlerAI）定位为"项目管家"，为大学生创业者提供任务看板、进度跟踪、资源对接和团队协作功能。本计划在现有 `src/components/butler/` 目录基础上，新增4个核心面板并整合到 `ButlerAI.tsx` 页面中。

### 现有代码基础

| 文件路径 | 说明 |
|---------|------|
| `src/pages/ButlerAI.tsx` | 管家AI主页面，已接入 ChatLayout |
| `src/components/butler/ProjectManagementPanel.tsx` | 现有项目管理面板 |
| `src/components/butler/DataDashboard.tsx` | 现有数据看板 |
| `src/components/butler/FAQPanel.tsx` | 现有FAQ面板 |
| `src/components/butler/FeedbackPanel.tsx` | 现有问题反馈面板 |
| `src/components/butler/AfterSalesPanel.tsx` | 现有售后咨询面板 |
| `src/components/butler/ResultsPanel.tsx` | 现有成果展示面板 |
| `src/services/butlerService.ts` | 管家AI服务层 |
| `src/services/aiService.ts` | AI服务层，已有 `chatWithZhipuStream` |

### 子菜单规划（需更新 App.tsx）

```typescript
const butlerSubs: SubMenuItem[] = [
  { key: 'task_board', label: '任务看板' },       // 任务1
  { key: 'progress', label: '进度跟踪' },          // 任务2
  { key: 'resource_match', label: '资源对接' },     // 任务3
  { key: 'team_collab', label: '团队协作' },        // 任务4
];
```

---

### 任务1：创建项目看板组件（四列看板）

**文件：** Create `src/components/butler/TaskBoard.tsx`

**目标：** 实现待办/进行中/已完成/阻塞四列看板，支持拖拽移动和AI任务拆解。

- [ ] 步骤1：定义任务数据类型和看板配置

```typescript
// src/components/butler/TaskBoard.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Modal, Form, DatePicker, message, Tooltip,
  Dropdown, Badge, Progress, Space,
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  PlusOutlined, DeleteOutlined, EditOutlined, ThunderboltOutlined,
  DragOutlined, TeamOutlined, FlagOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 任务状态
 */
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

/**
 * 任务优先级
 */
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * 任务项
 */
interface Task {
  id: string;
  title: string;          // 任务标题
  description: string;    // 任务描述
  status: TaskStatus;     // 状态
  priority: TaskPriority; // 优先级
  assignee: string;       // 负责人
  dueDate: string;        // 截止日期
  createdAt: number;      // 创建时间
  tags: string[];         // 标签
  progress: number;       // 进度(0-100)
}

/**
 * 看板列配置
 */
interface BoardColumn {
  key: TaskStatus;
  title: string;
  color: string;
  icon: React.ReactNode;
}

const TASK_STORAGE_KEY = 'butler_task_board';
```

- [ ] 步骤2：定义看板列和优先级配置

```typescript
const boardColumns: BoardColumn[] = [
  { key: 'todo', title: '待办', color: '#1890ff', icon: <ClockCircleOutlined /> },
  { key: 'in_progress', title: '进行中', color: '#faad14', icon: <DragOutlined /> },
  { key: 'done', title: '已完成', color: '#52c41a', icon: <CheckCircleOutlined /> },
  { key: 'blocked', title: '阻塞', color: '#ff4d4f', icon: <ExclamationCircleOutlined /> },
];

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: '低', color: '#d9d9d9' },
  medium: { label: '中', color: '#1890ff' },
  high: { label: '高', color: '#fa8c16' },
  urgent: { label: '紧急', color: '#ff4d4f' },
};

// 模拟初始任务数据
const initialTasks: Task[] = [
  {
    id: '1',
    title: '完成市场调研报告',
    description: '收集目标市场数据，分析用户需求',
    status: 'in_progress',
    priority: 'high',
    assignee: '张三',
    dueDate: '2026-08-01',
    createdAt: Date.now() - 86400000 * 3,
    tags: ['市场', '调研'],
    progress: 60,
  },
  {
    id: '2',
    title: '设计产品原型',
    description: '使用Figma设计产品首页和核心功能页',
    status: 'todo',
    priority: 'urgent',
    assignee: '李四',
    dueDate: '2026-07-30',
    createdAt: Date.now() - 86400000 * 1,
    tags: ['设计', '原型'],
    progress: 0,
  },
  {
    id: '3',
    title: '搭建开发环境',
    description: '配置React+TypeScript开发环境',
    status: 'done',
    priority: 'medium',
    assignee: '王五',
    dueDate: '2026-07-20',
    createdAt: Date.now() - 86400000 * 5,
    tags: ['开发'],
    progress: 100,
  },
  {
    id: '4',
    title: '等待投资方反馈',
    description: '已提交BP，等待投资方审阅反馈',
    status: 'blocked',
    priority: 'high',
    assignee: '张三',
    dueDate: '2026-08-05',
    createdAt: Date.now() - 86400000 * 2,
    tags: ['融资'],
    progress: 30,
  },
];
```

- [ ] 步骤3：实现看板组件核心逻辑（含localStorage持久化和AI任务拆解）

```typescript
const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(TASK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [aiBreakingDown, setAiBreakingDown] = useState(false);
  const [aiTaskInput, setAiTaskInput] = useState('');
  const aiContentRef = useRef('');

  // 自动保存到localStorage
  useEffect(() => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // 添加任务
  const handleAddTask = async () => {
    const values = await form.validateFields();
    const newTask: Task = {
      id: Date.now().toString(),
      title: values.title,
      description: values.description || '',
      status: values.status || 'todo',
      priority: values.priority || 'medium',
      assignee: values.assignee || '未分配',
      dueDate: values.dueDate?.format('YYYY-MM-DD') || '',
      createdAt: Date.now(),
      tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
      progress: 0,
    };
    setTasks(prev => [...prev, newTask]);
    message.success('任务已添加');
    setIsAddModalOpen(false);
    form.resetFields();
  };

  // 更新任务状态（拖拽或手动移动）
  const handleMoveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              progress: newStatus === 'done' ? 100 : newStatus === 'todo' ? 0 : task.progress,
            }
          : task
      )
    );
  };

  // 拖拽处理
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, column: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDrop = (column: TaskStatus) => {
    if (draggedTaskId) {
      handleMoveTask(draggedTaskId, column);
      setDraggedTaskId(null);
      setDragOverColumn(null);
    }
  };

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    message.success('任务已删除');
  };

  // 编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      dueDate: task.dueDate ? undefined : undefined, // DatePicker需要dayjs对象
    });
    setIsAddModalOpen(true);
  };

  /**
   * AI智能任务拆解
   */
  const handleAIBreakdown = async () => {
    if (!aiTaskInput.trim()) {
      message.warning('请输入要拆解的任务描述');
      return;
    }

    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('butler')}
你是项目管理专家。请将以下任务拆解为具体的子任务，以便于执行。

任务描述：${aiTaskInput}

请严格按照以下JSON数组格式输出，不要输出其他内容：
[
  {
    "title": "子任务标题",
    "description": "子任务描述",
    "priority": "low|medium|high|urgent",
    "estimatedDays": 3
  }
]

拆解要求：
1. 拆解为3-6个可执行的子任务
2. 每个子任务有明确的交付物
3. 按执行顺序排列
4. 估算完成天数`;

    setAiBreakingDown(true);
    aiContentRef.current = '';

    try {
      await chatWithZhipuStream(
        [{ role: 'user', content: `请拆解任务：${aiTaskInput}` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
        },
        { system_prompt: systemPrompt, temperature: 0.6, max_tokens: 1500, token }
      );

      // 解析JSON数组
      const jsonMatch = aiContentRef.current.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const subTasks = JSON.parse(jsonMatch[0]);
        const newTasks: Task[] = subTasks.map((st: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          title: st.title,
          description: st.description,
          status: 'todo' as TaskStatus,
          priority: st.priority as TaskPriority,
          assignee: '未分配',
          dueDate: '',
          createdAt: Date.now(),
          tags: ['AI拆解'],
          progress: 0,
        }));
        setTasks(prev => [...prev, ...newTasks]);
        message.success(`AI已拆解出${newTasks.length}个子任务`);
        setAiTaskInput('');
      } else {
        message.warning('AI输出格式异常，请重试');
      }
    } catch (error) {
      message.error('AI任务拆解失败');
    } finally {
      setAiBreakingDown(false);
    }
  };
```

- [ ] 步骤4：实现四列看板渲染和任务卡片

```typescript
  /**
   * 任务卡片子组件
   */
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const priority = priorityConfig[task.priority];
    return (
      <div
        draggable
        onDragStart={() => handleDragStart(task.id)}
        style={{
          padding: 12,
          marginBottom: 8,
          borderRadius: 8,
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-light)',
          cursor: 'grab',
          opacity: draggedTaskId === task.id ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text strong style={{ fontSize: 13, flex: 1 }}>{task.title}</Text>
          <Tag color={priority.color} style={{ fontSize: 10, marginLeft: 4 }}>{priority.label}</Tag>
        </div>
        {task.description && (
          <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {task.description}
          </Paragraph>
        )}
        {task.tags.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {task.tags.map(tag => (
              <Tag key={tag} style={{ fontSize: 10, marginBottom: 2 }}>{tag}</Tag>
            ))}
          </div>
        )}
        {task.status === 'in_progress' && (
          <Progress percent={task.progress} size="small" style={{ marginBottom: 8 }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          <Space size={4}>
            <Avatar size={20} style={{ background: '#8B5CF6', fontSize: 10 }}>
              {task.assignee.charAt(0)}
            </Avatar>
            <span>{task.assignee}</span>
          </Space>
          {task.dueDate && (
            <span><CalendarOutlined style={{ marginRight: 4 }} />{task.dueDate}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditTask(task)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTask(task.id)} />
        </div>
      </div>
    );
  };

  // 统计数据
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #a855f7 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<CheckCircleOutlined />} />
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>任务看板</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>拖拽管理 · AI任务拆解</div>
            </div>
          </div>
          <Button
            icon={<PlusOutlined />}
            onClick={() => { setEditingTask(null); form.resetFields(); setIsAddModalOpen(true); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
          >
            添加任务
          </Button>
        </div>
        {/* 统计 */}
        <Row gutter={12} style={{ marginTop: 16 }}>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{taskStats.total}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>总任务</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{taskStats.inProgress}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>进行中</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{taskStats.done}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>已完成</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{taskStats.blocked}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>阻塞</div>
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ padding: 16 }}>
        {/* AI任务拆解区 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            <ThunderboltOutlined style={{ marginRight: 6, color: '#722ed1' }} />AI智能任务拆解
          </Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入一个大任务，AI帮你拆解为可执行的子任务..."
              value={aiTaskInput}
              onChange={e => setAiTaskInput(e.target.value)}
              onPressEnter={handleAIBreakdown}
            />
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleAIBreakdown}
              loading={aiBreakingDown}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}
            >
              拆解
            </Button>
          </Space.Compact>
        </Card>

        {/* 四列看板 */}
        <Row gutter={[12, 12]}>
          {boardColumns.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.key);
            return (
              <Col span={6} key={column.key}>
                <div
                  onDragOver={(e) => handleDragOver(e, column.key)}
                  onDrop={() => handleDrop(column.key)}
                  style={{
                    background: dragOverColumn === column.key ? `${column.color}10` : 'var(--bg-glass)',
                    borderRadius: 10,
                    border: dragOverColumn === column.key ? `2px dashed ${column.color}` : '1px solid var(--border-light)',
                    minHeight: 400,
                    padding: 12,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* 列标题 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${column.color}` }}>
                    <Space>
                      <span style={{ color: column.color }}>{column.icon}</span>
                      <Text strong style={{ color: column.color, fontSize: 14 }}>{column.title}</Text>
                    </Space>
                    <Badge count={columnTasks.length} style={{ background: column.color }} />
                  </div>
                  {/* 任务卡片列表 */}
                  {columnTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 12 }}>
                      拖拽任务到此列
                    </div>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* 添加/编辑任务弹窗 */}
      <Modal
        title={editingTask ? '编辑任务' : '添加任务'}
        open={isAddModalOpen}
        onOk={handleAddTask}
        onCancel={() => { setIsAddModalOpen(false); setEditingTask(null); form.resetFields(); }}
        okText={editingTask ? '保存' : '添加'}
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={2} placeholder="详细描述任务内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select defaultValue="todo">
                  {boardColumns.map(col => (
                    <Select.Option key={col.key} value={col.key}>{col.title}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级">
                <Select defaultValue="medium">
                  {Object.entries(priorityConfig).map(([key, val]) => (
                    <Select.Option key={key} value={key}>{val.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="assignee" label="负责人">
                <Input placeholder="负责人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="tags" label="标签（逗号分隔）">
            <Input placeholder="例如：市场,调研" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskBoard;
```

- [ ] 步骤5：验证方法
  - 确认文件无编译错误
  - 测试四列看板渲染、任务增删改
  - 测试拖拽移动任务（HTML5 Drag and Drop API）
  - 测试AI任务拆解功能（输入大任务，AI返回子任务JSON并自动添加到看板）
  - 验证localStorage持久化（刷新页面后任务保留）

- [ ] 步骤6：下一步
  - 进入任务2：创建进度跟踪组件

---

### 任务2：创建进度跟踪组件（甘特图/进度条）

**文件：** Create `src/components/butler/ProgressTracker.tsx`

**目标：** 以甘特图和进度条形式可视化展示项目进度，AI生成进度报告。

- [ ] 步骤1：定义进度数据类型

```typescript
// src/components/butler/ProgressTracker.tsx

import React, { useState, useRef, useMemo } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Progress, Statistic, Timeline, message, Tooltip,
} from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, ThunderboltOutlined,
  BarChartOutlined, CalendarOutlined, FlagOutlined, RiseOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';

const { Text, Title, Paragraph } = Typography;

/**
 * 里程碑
 */
interface Milestone {
  id: string;
  name: string;          // 里程碑名称
  plannedDate: string;   // 计划日期
  actualDate: string;    // 实际完成日期
  status: 'completed' | 'in_progress' | 'delayed' | 'not_started';
  progress: number;      // 进度(0-100)
}

/**
 * 项目阶段（甘特图条目）
 */
interface ProjectPhase {
  id: string;
  name: string;          // 阶段名称
  startDate: string;     // 开始日期
  endDate: string;       // 结束日期
  progress: number;      // 进度
  status: 'completed' | 'in_progress' | 'not_started' | 'delayed';
  dependencies: string[]; // 依赖阶段
  assignee: string;      // 负责人
}
```

- [ ] 步骤2：实现甘特图SVG绘制和进度数据管理

```typescript
// 模拟数据
const initialMilestones: Milestone[] = [
  { id: '1', name: '市场调研完成', plannedDate: '2026-07-15', actualDate: '2026-07-14', status: 'completed', progress: 100 },
  { id: '2', name: 'MVP原型完成', plannedDate: '2026-07-30', actualDate: '', status: 'in_progress', progress: 70 },
  { id: '3', name: '内测版本发布', plannedDate: '2026-08-15', actualDate: '', status: 'not_started', progress: 0 },
  { id: '4', name: '正式上线', plannedDate: '2026-09-01', actualDate: '', status: 'not_started', progress: 0 },
];

const initialPhases: ProjectPhase[] = [
  { id: '1', name: '市场调研', startDate: '2026-07-01', endDate: '2026-07-15', progress: 100, status: 'completed', dependencies: [], assignee: '张三' },
  { id: '2', name: '产品设计', startDate: '2026-07-10', endDate: '2026-07-30', progress: 70, status: 'in_progress', dependencies: ['1'], assignee: '李四' },
  { id: '3', name: '前端开发', startDate: '2026-07-20', endDate: '2026-08-15', progress: 30, status: 'in_progress', dependencies: ['2'], assignee: '王五' },
  { id: '4', name: '后端开发', startDate: '2026-07-25', endDate: '2026-08-20', progress: 20, status: 'in_progress', dependencies: ['2'], assignee: '赵六' },
  { id: '5', name: '测试验收', startDate: '2026-08-15', endDate: '2026-08-30', progress: 0, status: 'not_started', dependencies: ['3', '4'], assignee: '张三' },
  { id: '6', name: '上线部署', startDate: '2026-08-30', endDate: '2026-09-01', progress: 0, status: 'not_started', dependencies: ['5'], assignee: '全体' },
];

const ProgressTracker: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [phases, setPhases] = useState<ProjectPhase[]>(initialPhases);
  const [aiReport, setAiReport] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  // 计算项目整体进度
  const overallProgress = useMemo(() => {
    const totalProgress = phases.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / phases.length);
  }, [phases]);

  // 甘特图日期范围
  const ganttDateRange = useMemo(() => {
    const allDates = phases.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    return { minDate, maxDate, totalDays: Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000) };
  }, [phases]);

  /**
   * 计算甘特图条目位置
   */
  const getGanttBarPosition = (phase: ProjectPhase) => {
    const start = new Date(phase.startDate);
    const end = new Date(phase.endDate);
    const offsetDays = Math.ceil((start.getTime() - ganttDateRange.minDate.getTime()) / 86400000);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    const totalDays = ganttDateRange.totalDays + 1;
    return {
      left: `${(offsetDays / totalDays) * 100}%`,
      width: `${(durationDays / totalDays) * 100}%`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#52c41a';
      case 'in_progress': return '#faad14';
      case 'delayed': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'delayed': return '已延期';
      default: return '未开始';
    }
  };
```

- [ ] 步骤3：实现AI进度报告生成

```typescript
  /**
   * AI生成进度报告
   */
  const handleAIReport = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('butler')}
你是项目管理专家。请基于以下项目进度数据，生成一份进度分析报告。

项目整体进度：${overallProgress}%

里程碑：
${milestones.map(m => `- ${m.name}：计划${m.plannedDate}，${m.actualDate ? `实际${m.actualDate}` : '未完成'}，状态：${getStatusLabel(m.status)}，进度${m.progress}%`).join('\n')}

项目阶段：
${phases.map(p => `- ${p.name}：${p.startDate}至${p.endDate}，负责人${p.assignee}，状态：${getStatusLabel(p.status)}，进度${p.progress}%`).join('\n')}

请按以下格式输出（Markdown）：
## 项目进度总览
（整体进度评估、关键指标）

## 里程碑完成情况
（各里程碑状态分析、是否有延期风险）

## 各阶段详情
（每个阶段的进度分析、存在问题）

## 风险预警
（可能的延期风险、瓶颈环节）

## 下一步建议
（优先事项、资源调整建议）`;

    setAiReport({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiReport(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: `请生成项目进度报告，整体进度${overallProgress}%` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setAiReport(prev => ({ ...prev, content: aiContentRef.current }));
        },
        { system_prompt: systemPrompt, temperature: 0.6, max_tokens: 2000, token }
      );
      setAiReport(prev => ({ ...prev, isStreaming: false }));
    } catch (error) {
      setAiReport({ content: '', isStreaming: false, error: error instanceof Error ? error.message : '生成失败' });
      message.error('AI进度报告生成失败');
    }
  };
```

- [ ] 步骤4：实现完整渲染（整体进度 + 甘特图 + 里程碑 + AI报告）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #a855f7 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<BarChartOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>进度跟踪</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>甘特图 · 里程碑 · AI进度报告</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 整体进度 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6} style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={overallProgress} size={100}
                strokeColor={{ '0%': '#8B5CF6', '100%': '#a855f7' }} />
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>项目整体进度</div>
            </Col>
            <Col span={18}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic title="总阶段数" value={phases.length} suffix="个" />
                </Col>
                <Col span={6}>
                  <Statistic title="已完成" value={phases.filter(p => p.status === 'completed').length}
                    valueStyle={{ color: '#52c41a' }} suffix="个" />
                </Col>
                <Col span={6}>
                  <Statistic title="进行中" value={phases.filter(p => p.status === 'in_progress').length}
                    valueStyle={{ color: '#faad14' }} suffix="个" />
                </Col>
                <Col span={6}>
                  <Statistic title="未开始" value={phases.filter(p => p.status === 'not_started').length}
                    valueStyle={{ color: '#d9d9d9' }} suffix="个" />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* 甘特图 */}
        <Card title={<span><CalendarOutlined style={{ marginRight: 8 }} />项目甘特图</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          {/* 甘特图主体 */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 600 }}>
              {/* 日期轴 */}
              <div style={{ display: 'flex', marginBottom: 8, paddingLeft: 120, position: 'relative', height: 24 }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{ganttDateRange.minDate.toLocaleDateString('zh-CN')}</span>
                  <span>{ganttDateRange.maxDate.toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              {/* 阶段条目 */}
              {phases.map(phase => {
                const pos = getGanttBarPosition(phase);
                const color = getStatusColor(phase.status);
                return (
                  <div key={phase.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, height: 36 }}>
                    {/* 阶段名称 */}
                    <div style={{ width: 120, flexShrink: 0, paddingRight: 8, fontSize: 12, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Tooltip title={`${phase.name}（${phase.assignee}）`}>
                        <Text style={{ fontSize: 12 }}>{phase.name}</Text>
                      </Tooltip>
                    </div>
                    {/* 甘特条区域 */}
                    <div style={{ flex: 1, position: 'relative', height: 24, background: 'var(--bg-glass)', borderRadius: 4 }}>
                      {/* 甘特条 */}
                      <div
                        style={{
                          position: 'absolute',
                          left: pos.left,
                          width: pos.width,
                          top: 2,
                          height: 20,
                          background: `${color}30`,
                          border: `1px solid ${color}`,
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        {/* 进度填充 */}
                        <div style={{
                          width: `${phase.progress}%`,
                          height: '100%',
                          background: color,
                          borderRadius: 3,
                          transition: 'width 0.3s',
                        }} />
                        {/* 进度文字 */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: '#fff',
                          fontWeight: 'bold',
                        }}>
                          {phase.progress}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* 图例 */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)', fontSize: 12 }}>
            {[
              { color: '#52c41a', label: '已完成' },
              { color: '#faad14', label: '进行中' },
              { color: '#ff4d4f', label: '已延期' },
              { color: '#d9d9d9', label: '未开始' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: item.color, borderRadius: 3 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 里程碑 */}
        <Card title={<span><FlagOutlined style={{ marginRight: 8 }} />关键里程碑</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Timeline
            items={milestones.map(m => ({
              color: getStatusColor(m.status),
              children: (
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong>{m.name}</Text>
                    <Tag color={getStatusColor(m.status)}>{getStatusLabel(m.status)}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />计划：{m.plannedDate}
                    {m.actualDate && <span style={{ marginLeft: 12, color: '#52c41a' }}>实际：{m.actualDate}</span>}
                  </div>
                  {m.status === 'in_progress' && (
                    <Progress percent={m.progress} size="small" style={{ marginTop: 8, maxWidth: 300 }} />
                  )}
                </div>
              ),
            }))}
          />
        </Card>

        {/* AI进度报告 */}
        <Card title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI进度分析报告</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAIReport}
              loading={aiReport.isStreaming}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}>
              {aiReport.isStreaming ? '生成中...' : '生成进度报告'}
            </Button>
          }>
          {aiReport.error && <Alert message="生成失败" description={aiReport.error} type="error" showIcon style={{ marginBottom: 12 }} />}
          {aiReport.isStreaming && !aiReport.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" tip="AI正在分析进度..." /></div>
          )}
          {aiReport.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{aiReport.content}</div>
          )}
          {!aiReport.content && !aiReport.isStreaming && !aiReport.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              点击"生成进度报告"获取AI项目进度分析
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProgressTracker;
```

- [ ] 步骤5：验证方法
  - 确认文件无编译错误
  - 测试甘特图渲染（阶段条目位置和进度填充正确）
  - 测试里程碑时间线展示
  - 测试AI进度报告生成

- [ ] 步骤6：下一步
  - 进入任务3：创建资源对接推荐组件

---

### 任务3：创建资源对接推荐组件

**文件：** Create `src/components/butler/ResourceMatcher.tsx`

**目标：** 根据项目需求智能推荐匹配的资源（资金、人才、技术、渠道），AI生成资源对接建议。

- [ ] 步骤1：定义资源数据类型

```typescript
// src/components/butler/ResourceMatcher.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Rate, message, Space, Tooltip, Progress,
} from 'antd';
import {
  LinkOutlined, ThunderboltOutlined, DollarOutlined, TeamOutlined,
  CodeOutlined, ShopOutlined, BookOutlined, StarOutlined, AimOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 资源类型
 */
type ResourceType = 'funding' | 'talent' | 'tech' | 'channel' | 'knowledge';

/**
 * 资源项
 */
interface ResourceItem {
  id: string;
  name: string;           // 资源名称
  type: ResourceType;     // 资源类型
  provider: string;       // 提供方
  description: string;    // 描述
  matchScore: number;     // 匹配度(0-100)
  tags: string[];         // 标签
  contact: string;        // 联系方式
  availability: 'available' | 'limited' | 'unavailable';
}

/**
 * 项目需求
 */
interface ProjectNeeds {
  projectName: string;
  industry: string;
  stage: string;
  needs: string[];        // 需求列表
  budget: string;
}
```

- [ ] 步骤2：实现资源推荐逻辑

```typescript
const resourceTypeConfig: Record<ResourceType, { label: string; icon: React.ReactNode; color: string }> = {
  funding: { label: '资金资源', icon: <DollarOutlined />, color: '#52c41a' },
  talent: { label: '人才资源', icon: <TeamOutlined />, color: '#1890ff' },
  tech: { label: '技术资源', icon: <CodeOutlined />, color: '#722ed1' },
  channel: { label: '渠道资源', icon: <ShopOutlined />, color: '#fa8c16' },
  knowledge: { label: '知识资源', icon: <BookOutlined />, color: '#13c2c2' },
};

// 模拟资源库
const resourceDatabase: ResourceItem[] = [
  { id: '1', name: '大学生创业扶持基金', type: 'funding', provider: '教育部', description: '面向大学生创业者的无息贷款，最高50万', matchScore: 92, tags: ['大学生', '无息', '创业'], contact: 'edu-support@example.com', availability: 'available' },
  { id: '2', name: 'AI技术开源社区', type: 'tech', provider: '开源中国', description: '提供AI开发工具、模型、技术问答', matchScore: 88, tags: ['AI', '开源', '免费'], contact: 'community@oschina.net', availability: 'available' },
  { id: '3', name: '校园创业孵化器', type: 'channel', provider: '各高校', description: '提供办公场地、导师辅导、资源对接', matchScore: 85, tags: ['孵化', '场地', '导师'], contact: 'incubator@campus.edu', availability: 'limited' },
  { id: '4', name: '全栈开发工程师（兼职）', type: 'talent', provider: '自由职业者', description: '5年经验全栈工程师，可兼职参与项目', matchScore: 78, tags: ['全栈', 'React', 'Node'], contact: 'dev@example.com', availability: 'available' },
  { id: '5', name: '创业法律指南', type: 'knowledge', provider: '法务平台', description: '创业相关法律知识、合同模板', matchScore: 75, tags: ['法律', '合同', '免费'], contact: 'legal@example.com', availability: 'available' },
];

const ResourceMatcher: React.FC = () => {
  const [projectNeeds, setProjectNeeds] = useState<ProjectNeeds>({
    projectName: '',
    industry: 'tech',
    stage: 'idea',
    needs: [],
    budget: '10万以内',
  });
  const [needsInput, setNeedsInput] = useState('');
  const [matchedResources, setMatchedResources] = useState<ResourceItem[]>(resourceDatabase);
  const [aiSuggestion, setAiSuggestion] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  // 添加需求
  const handleAddNeed = () => {
    if (needsInput.trim() && !projectNeeds.needs.includes(needsInput.trim())) {
      setProjectNeeds(prev => ({ ...prev, needs: [...prev.needs, needsInput.trim()] }));
      setNeedsInput('');
    }
  };

  // 移除需求
  const handleRemoveNeed = (need: string) => {
    setProjectNeeds(prev => ({ ...prev, needs: prev.needs.filter(n => n !== need) });
  };

  /**
   * AI生成资源对接建议
   */
  const handleAIMatch = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('butler')}
你是资源对接专家。请基于以下项目需求，生成资源对接建议报告。

项目信息：
- 名称：${projectNeeds.projectName || '未命名项目'}
- 行业：${projectNeeds.industry}
- 阶段：${projectNeeds.stage}
- 预算：${projectNeeds.budget}

需求列表：
${projectNeeds.needs.map(n => `- ${n}`).join('\n') || '（暂无明确需求）'}

可用资源库：
${resourceDatabase.map(r => `- ${r.name}（${resourceTypeConfig[r.type].label}）：${r.description}，匹配度${r.matchScore}%`).join('\n')}

请按以下格式输出（Markdown）：
## 需求分析
（项目核心需求解读、优先级排序）

## 资源匹配推荐
（针对每个需求推荐最匹配的资源，说明匹配理由）

## 对接策略
（资源获取的先后顺序、对接方式建议）

## 成本优化建议
（如何在有限预算内最大化资源利用）

## 大学生专属资源
（特别适合大学生创业者的免费/优惠资源）`;

    setAiSuggestion({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiSuggestion(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: `请为「${projectNeeds.projectName || '我的项目'}」生成资源对接建议` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setAiSuggestion(prev => ({ ...prev, content: aiContentRef.current }));
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 2000, token }
      );
      setAiSuggestion(prev => ({ ...prev, isStreaming: false }));
    } catch (error) {
      setAiSuggestion({ content: '', isStreaming: false, error: error instanceof Error ? error.message : '生成失败' });
      message.error('AI资源对接建议生成失败');
    }
  };
```

- [ ] 步骤3：实现完整渲染

```typescript
  const availabilityConfig = {
    available: { label: '可用', color: '#52c41a' },
    limited: { label: '有限', color: '#faad14' },
    unavailable: { label: '不可用', color: '#ff4d4f' },
  };

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891b2 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<LinkOutlined />} />
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>资源对接</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>智能匹配 · AI对接策略</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 项目需求输入 */}
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col span={8}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>项目名称</Text>
              <Input placeholder="输入项目名称" value={projectNeeds.projectName}
                onChange={e => setProjectNeeds(prev => ({ ...prev, projectName: e.target.value }))} />
            </Col>
            <Col span={5}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>行业</Text>
              <Select value={projectNeeds.industry} style={{ width: '100%' }}
                onChange={v => setProjectNeeds(prev => ({ ...prev, industry: v }))}
                options={[{ value: 'tech', label: '科技' }, { value: 'finance', label: '金融' }, { value: 'healthcare', label: '医疗' }, { value: 'education', label: '教育' }, { value: 'retail', label: '零售' }]} />
            </Col>
            <Col span={5}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>阶段</Text>
              <Select value={projectNeeds.stage} style={{ width: '100%' }}
                onChange={v => setProjectNeeds(prev => ({ ...prev, stage: v }))}
                options={[{ value: 'idea', label: '创意' }, { value: 'mvp', label: 'MVP' }, { value: 'launch', label: '启动' }, { value: 'growth', label: '增长' }]} />
            </Col>
            <Col span={6}>
              <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>预算</Text>
              <Select value={projectNeeds.budget} style={{ width: '100%' }}
                onChange={v => setProjectNeeds(prev => ({ ...prev, budget: v }))}
                options={[{ value: '免费', label: '免费资源' }, { value: '5万以内', label: '5万以内' }, { value: '10万以内', label: '10万以内' }, { value: '10-50万', label: '10-50万' }, { value: '50万以上', label: '50万以上' }]} />
            </Col>
          </Row>
          {/* 需求标签 */}
          <div style={{ marginTop: 12 }}>
            <Text style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>项目需求</Text>
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input placeholder="输入需求（如：需要前端开发、需要资金10万）" value={needsInput}
                onChange={e => setNeedsInput(e.target.value)} onPressEnter={handleAddNeed} />
              <Button type="primary" onClick={handleAddNeed}>添加</Button>
            </Space.Compact>
            <Space wrap>
              {projectNeeds.needs.map(need => (
                <Tag key={need} closable onClose={() => handleRemoveNeed(need)} color="cyan">{need}</Tag>
              ))}
              {projectNeeds.needs.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>暂无需求，请添加</Text>}
            </Space>
          </div>
        </Card>

        {/* 资源推荐列表 */}
        <Card title={<span><AimOutlined style={{ marginRight: 8 }} />匹配资源推荐</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          {matchedResources.length > 0 ? (
            <Row gutter={[12, 12]}>
              {matchedResources.map(resource => {
                const typeConfig = resourceTypeConfig[resource.type];
                const avail = availabilityConfig[resource.availability];
                return (
                  <Col span={12} key={resource.id}>
                    <Card size="small" hoverable style={{ borderRadius: 10, border: '1px solid var(--border-light)', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar size={32} style={{ background: typeConfig.color }}>{typeConfig.icon}</Avatar>
                          <div>
                            <Text strong style={{ fontSize: 14 }}>{resource.name}</Text>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{resource.provider}</div>
                          </div>
                        </div>
                        <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
                      </div>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        {resource.description}
                      </Paragraph>
                      <div style={{ marginBottom: 8 }}>
                        {resource.tags.map(tag => <Tag key={tag} style={{ fontSize: 10 }}>{tag}</Tag>)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>匹配度</Text>
                          <Progress percent={resource.matchScore} size="small" style={{ width: 100 }} strokeColor={typeConfig.color} />
                        </div>
                        <Tag color={avail.color}>{avail.label}</Tag>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty description="暂无匹配资源" />
          )}
        </Card>

        {/* AI资源对接建议 */}
        <Card title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI资源对接建议</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAIMatch}
              loading={aiSuggestion.isStreaming}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}>
              {aiSuggestion.isStreaming ? '生成中...' : '生成对接建议'}
            </Button>
          }>
          {aiSuggestion.error && <Alert message="生成失败" description={aiSuggestion.error} type="error" showIcon style={{ marginBottom: 12 }} />}
          {aiSuggestion.isStreaming && !aiSuggestion.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" tip="AI正在生成对接建议..." /></div>
          )}
          {aiSuggestion.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{aiSuggestion.content}</div>
          )}
          {!aiSuggestion.content && !aiSuggestion.isStreaming && !aiSuggestion.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              填写项目需求后，点击"生成对接建议"获取AI资源对接策略
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResourceMatcher;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 测试需求添加/删除、资源列表展示、AI建议生成

- [ ] 步骤5：下一步
  - 进入任务4：创建团队协作组件

---

### 任务4：创建团队协作组件

**文件：** Create `src/components/butler/TeamCollab.tsx`

**目标：** 展示团队成员、角色分工、协作动态，AI生成团队管理建议。

- [ ] 步骤1：定义团队数据类型

```typescript
// src/components/butler/TeamCollab.tsx

import React, { useState, useRef } from 'react';
import {
  Card, Input, Button, Row, Col, Tag, Typography, Spin, Alert, Empty,
  Avatar, Divider, Select, Modal, Form, message, Space, Tooltip, Timeline,
} from 'antd';
import {
  TeamOutlined, ThunderboltOutlined, PlusOutlined, UserOutlined,
  MessageOutlined, BellOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { chatWithZhipuStream, getSystemPrompt } from '../../services/aiService';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 团队成员
 */
interface TeamMember {
  id: string;
  name: string;          // 姓名
  role: string;          // 角色
  avatar?: string;       // 头像
  skills: string[];      // 技能
  responsibility: string;// 职责
  workload: number;      // 工作量(0-100)
  status: 'active' | 'idle' | 'offline';
  contribution: number;  // 贡献度(0-100)
}

/**
 * 协作动态
 */
interface CollaborationEvent {
  id: string;
  member: string;
  action: string;
  target: string;
  timestamp: number;
  type: 'task' | 'message' | 'milestone' | 'file';
}
```

- [ ] 步骤2：实现团队管理逻辑

```typescript
const initialMembers: TeamMember[] = [
  { id: '1', name: '张三', role: '项目负责人', skills: ['项目管理', '市场分析', '融资'], responsibility: '整体规划、对外沟通、融资', workload: 80, status: 'active', contribution: 85 },
  { id: '2', name: '李四', role: '产品设计师', skills: ['UI/UX', 'Figma', '原型设计'], responsibility: '产品设计、原型、视觉', workload: 65, status: 'active', contribution: 75 },
  { id: '3', name: '王五', role: '前端开发', skills: ['React', 'TypeScript', 'CSS'], responsibility: '前端开发、页面实现', workload: 90, status: 'active', contribution: 80 },
  { id: '4', name: '赵六', role: '后端开发', skills: ['Node.js', '数据库', 'API'], responsibility: '后端开发、API设计', workload: 70, status: 'idle', contribution: 65 },
];

const initialEvents: CollaborationEvent[] = [
  { id: '1', member: '王五', action: '完成了任务', target: '首页开发', timestamp: Date.now() - 3600000, type: 'task' },
  { id: '2', member: '李四', action: '上传了文件', target: '产品原型V2.fig', timestamp: Date.now() - 7200000, type: 'file' },
  { id: '3', member: '张三', action: '发布了消息', target: '明天开会讨论融资进度', timestamp: Date.now() - 10800000, type: 'message' },
  { id: '4', member: '赵六', action: '达成了里程碑', target: 'API接口开发完成', timestamp: Date.now() - 86400000, type: 'milestone' },
];

const TeamCollab: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [events] = useState<CollaborationEvent[]>(initialEvents);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [aiAdvice, setAiAdvice] = useState({ content: '', isStreaming: false, error: null });
  const aiContentRef = useRef('');

  // 添加成员
  const handleAddMember = async () => {
    const values = await form.validateFields();
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: values.name,
      role: values.role,
      skills: values.skills ? values.skills.split(',').map((s: string) => s.trim()) : [],
      responsibility: values.responsibility || '',
      workload: 0,
      status: 'active',
      contribution: 0,
    };
    setMembers(prev => [...prev, newMember]);
    message.success(`成员「${newMember.name}」已添加`);
    setIsAddModalOpen(false);
    form.resetFields();
  };

  // 删除成员
  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    message.success('成员已移除');
  };

  /**
   * AI生成团队管理建议
   */
  const handleAIAdvice = async () => {
    const token = localStorage.getItem('ai-mate-token') || undefined;
    const systemPrompt = `${getSystemPrompt('butler')}
你是团队管理专家。请基于以下团队信息，生成团队协作优化建议。

团队成员：
${members.map(m => `- ${m.name}（${m.role}）：技能[${m.skills.join(', ')}]，职责：${m.responsibility}，工作量${m.workload}%，贡献度${m.contribution}%`).join('\n')}

协作动态：
${events.map(e => `- ${e.member}${e.action}：${e.target}`).join('\n')}

请按以下格式输出（Markdown）：
## 团队现状分析
（团队结构合理性、技能覆盖度、工作量分配）

## 协作效率评估
（沟通效率、任务分配合理性、瓶颈环节）

## 优化建议
（角色调整、工作量再分配、流程优化）

## 团队发展建议
（人才培养、招聘建议、团队文化建设）

## 大学生团队特别提醒
（针对大学生创业团队的管理建议）`;

    setAiAdvice({ content: '', isStreaming: false, error: null });
    aiContentRef.current = '';

    try {
      setAiAdvice(prev => ({ ...prev, isStreaming: true }));
      await chatWithZhipuStream(
        [{ role: 'user', content: `请为${members.length}人团队生成协作建议` }],
        (chunk: string) => {
          aiContentRef.current += chunk;
          setAiAdvice(prev => ({ ...prev, content: aiContentRef.current }));
        },
        { system_prompt: systemPrompt, temperature: 0.7, max_tokens: 2000, token }
      );
      setAiAdvice(prev => ({ ...prev, isStreaming: false }));
    } catch (error) {
      setAiAdvice({ content: '', isStreaming: false, error: error instanceof Error ? error.message : '生成失败' });
      message.error('AI团队建议生成失败');
    }
  };

  const statusConfig = {
    active: { label: '在线', color: '#52c41a' },
    idle: { label: '空闲', color: '#faad14' },
    offline: { label: '离线', color: '#d9d9d9' },
  };

  const eventTypeIcon = {
    task: <CheckCircleOutlined />,
    message: <MessageOutlined />,
    milestone: <BellOutlined />,
    file: <ClockCircleOutlined />,
  };
```

- [ ] 步骤3：实现完整渲染（成员列表 + 协作动态 + AI建议）

```typescript
  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 顶部标题 */}
      <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} style={{ background: 'rgba(255,255,255,0.2)' }} icon={<TeamOutlined />} />
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>团队协作</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>成员管理 · 协作动态 · AI优化建议</div>
            </div>
          </div>
          <Button icon={<PlusOutlined />} onClick={() => { form.resetFields(); setIsAddModalOpen(true); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
            添加成员
          </Button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {/* 团队成员列表 */}
          <Col span={16}>
            <Card title={<span><TeamOutlined style={{ marginRight: 8 }} />团队成员</span>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
              {members.map(member => {
                const status = statusConfig[member.status];
                return (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar size={44} style={{ background: '#ec4899' }}>{member.name.charAt(0)}</Avatar>
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 12, height: 12, borderRadius: '50%',
                        background: status.color, border: '2px solid var(--bg-glass)',
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong>{member.name}</Text>
                        <Tag color="pink">{member.role}</Tag>
                        <Tag color={status.color}>{status.label}</Tag>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {member.responsibility}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {member.skills.map(skill => (
                          <Tag key={skill} style={{ fontSize: 10 }}>{skill}</Tag>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>工作量</div>
                      <div style={{ fontSize: 18, fontWeight: 'bold', color: member.workload > 80 ? '#ff4d4f' : member.workload > 60 ? '#faad14' : '#52c41a' }}>
                        {member.workload}%
                      </div>
                    </div>
                    <Button type="text" danger size="small" onClick={() => handleRemoveMember(member.id)}>移除</Button>
                  </div>
                );
              })}
            </Card>
          </Col>

          {/* 协作动态 */}
          <Col span={8}>
            <Card title={<span><BellOutlined style={{ marginRight: 8 }} />协作动态</span>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: '100%' }}>
              <Timeline
                items={events.map(event => ({
                  dot: eventTypeIcon[event.type],
                  children: (
                    <div style={{ paddingBottom: 4 }}>
                      <div style={{ fontSize: 13 }}>
                        <Text strong>{event.member}</Text>
                        <span style={{ color: 'var(--text-secondary)' }}>{event.action}</span>
                        <Text strong style={{ color: '#ec4899' }}>{event.target}</Text>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(event.timestamp).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        </Row>

        {/* AI团队管理建议 */}
        <Card title={<span><ThunderboltOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI团队管理建议</span>}
          style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          extra={
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAIAdvice}
              loading={aiAdvice.isStreaming}
              style={{ background: 'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)', border: 'none' }}>
              {aiAdvice.isStreaming ? '生成中...' : '生成管理建议'}
            </Button>
          }>
          {aiAdvice.error && <Alert message="生成失败" description={aiAdvice.error} type="error" showIcon style={{ marginBottom: 12 }} />}
          {aiAdvice.isStreaming && !aiAdvice.content && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" tip="AI正在分析团队情况..." /></div>
          )}
          {aiAdvice.content && (
            <div className="ai-analysis-content" style={{ lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{aiAdvice.content}</div>
          )}
          {!aiAdvice.content && !aiAdvice.isStreaming && !aiAdvice.error && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
              点击"生成管理建议"获取AI团队协作优化方案
            </div>
          )}
        </Card>
      </div>

      {/* 添加成员弹窗 */}
      <Modal title="添加团队成员" open={isAddModalOpen} onOk={handleAddMember}
        onCancel={() => { setIsAddModalOpen(false); form.resetFields(); }}
        okText="添加" cancelText="取消" width={500}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="成员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select placeholder="选择角色">
                  {['项目负责人', '产品经理', '设计师', '前端开发', '后端开发', '市场运营', '其他'].map(r => (
                    <Select.Option key={r} value={r}>{r}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="skills" label="技能（逗号分隔）">
            <Input placeholder="例如：React, TypeScript, UI设计" />
          </Form.Item>
          <Form.Item name="responsibility" label="职责描述">
            <TextArea rows={2} placeholder="描述该成员的主要职责" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamCollab;
```

- [ ] 步骤4：验证方法
  - 确认文件无编译错误
  - 测试成员列表展示、添加/移除成员
  - 测试协作动态时间线展示
  - 测试AI团队管理建议生成

- [ ] 步骤5：下一步
  - 进入任务5：更新 ButlerAI.tsx 整合所有面板

---

### 任务5：更新 ButlerAI.tsx 整合所有子面板

**文件：** Modify `src/pages/ButlerAI.tsx`

**目标：** 将4个面板组件整合到 ButlerAI 页面，更新 App.tsx 子菜单。

- [ ] 步骤1：更新 `src/App.tsx` 中的 butlerSubs 菜单定义

```typescript
// src/App.tsx 中修改 butlerSubs

const butlerSubs: SubMenuItem[] = [
  { key: 'task_board', label: '任务看板' },
  { key: 'progress', label: '进度跟踪' },
  { key: 'resource_match', label: '资源对接' },
  { key: 'team_collab', label: '团队协作' },
];
```

- [ ] 步骤2：更新 `src/pages/ButlerAI.tsx`

```typescript
// src/pages/ButlerAI.tsx 完整更新

import React, { useState } from 'react';
import { CustomerServiceOutlined, CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import ChatLayout from '../components/ChatLayout';
import TaskBoard from '../components/butler/TaskBoard';
import ProgressTracker from '../components/butler/ProgressTracker';
import ResourceMatcher from '../components/butler/ResourceMatcher';
import TeamCollab from '../components/butler/TeamCollab';

interface ButlerAIProps {
  activeFeature?: string | null;
  onFeatureChange?: (feature: string | null) => void;
}

const ButlerAI: React.FC<ButlerAIProps> = ({ activeFeature: propFeature, onFeatureChange }) => {
  const [localFeature, setLocalFeature] = useState<string | null>(null);

  const activeFeature = propFeature !== undefined ? propFeature : localFeature;
  const setActiveFeature = onFeatureChange || setLocalFeature;

  const renderFeaturePanel = () => {
    if (!activeFeature) return undefined;

    const panelContent = (() => {
      switch (activeFeature) {
        case 'task_board':
          return <TaskBoard />;
        case 'progress':
          return <ProgressTracker />;
        case 'resource_match':
          return <ResourceMatcher />;
        case 'team_collab':
          return <TeamCollab />;
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
        <Button type="text" icon={<CloseOutlined />} size="small"
          onClick={() => setActiveFeature(null)}
          style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        {panelContent}
      </div>
    );
  };

  return (
    <ChatLayout
      role="butler"
      title="管家AI"
      icon={<CustomerServiceOutlined />}
      description="任务看板 · 进度跟踪 · 资源对接 · 团队协作"
      featurePanel={renderFeaturePanel()}
    />
  );
};

export default ButlerAI;
```

- [ ] 步骤3：验证方法
  - 启动开发服务器 `npm run dev`
  - 登录后进入管家AI页面
  - 依次点击侧边栏子菜单：任务看板、进度跟踪、资源对接、团队协作
  - 确认每个面板都能正确渲染
  - 测试各面板的AI功能

- [ ] 步骤4：最终检查清单
  - [ ] `TaskBoard.tsx` — 四列看板、拖拽移动、AI任务拆解、localStorage持久化
  - [ ] `ProgressTracker.tsx` — 甘特图、里程碑时间线、AI进度报告
  - [ ] `ResourceMatcher.tsx` — 需求管理、资源匹配列表、AI对接建议
  - [ ] `TeamCollab.tsx` — 成员管理、协作动态、AI管理建议
  - [ ] `ButlerAI.tsx` — 四个子面板切换正常
  - [ ] `App.tsx` — 子菜单显示正确

- [ ] 步骤5：下一步
  - 管家AI模块完成，四大AI模块（Plan-04~07）全部实施完毕

---

## 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/components/butler/TaskBoard.tsx` | 新建 | 任务看板（四列+拖拽+AI拆解） |
| `src/components/butler/ProgressTracker.tsx` | 新建 | 进度跟踪（甘特图+里程碑+AI报告） |
| `src/components/butler/ResourceMatcher.tsx` | 新建 | 资源对接推荐 |
| `src/components/butler/TeamCollab.tsx` | 新建 | 团队协作（成员+动态+AI建议） |
| `src/pages/ButlerAI.tsx` | 修改 | 整合4个子面板 |
| `src/App.tsx` | 修改 | 更新 butlerSubs 菜单 |

## 状态管理说明

| 组件 | 持久化方式 | 存储Key | 说明 |
|------|-----------|---------|------|
| TaskBoard | localStorage | `butler_task_board` | 任务列表自动保存 |
| ProgressTracker | 组件内状态 | - | 里程碑和阶段数据（可后续扩展为持久化） |
| ResourceMatcher | 组件内状态 | - | 项目需求和资源匹配 |
| TeamCollab | 组件内状态 | - | 团队成员和协作动态 |

## 注意事项

1. **拖拽实现**：TaskBoard 使用 HTML5 Drag and Drop API 实现原生拖拽，无需额外依赖
2. **甘特图**：ProgressTracker 使用 CSS 百分比定位绘制甘特图条，按日期范围自动计算位置
3. **AI JSON解析**：TaskBoard 的 AI 拆解功能需从流式输出中提取 JSON 数组，使用正则 `\[[\s\S]*\]` 匹配
4. **工作量预警**：团队成员工作量超过80%显示红色，60-80%显示橙色，低于60%显示绿色
5. **资源匹配度**：ResourceMatcher 中的匹配度为模拟数据，可后续接入后端API实现真实匹配
