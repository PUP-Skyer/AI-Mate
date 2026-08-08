/**
 * 新对话页面 - 独立对话界面
 * 中间：多角色对话区 | 右侧：可隐藏侧边栏（项目产物 + 项目进度）
 * 对话列表通过顶部"新对话"下拉菜单访问
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Layout,
  Input,
  Button,
  List,
  Typography,
  Space,
  Avatar,
  Tooltip,
  Empty,
  Spin,
  Tag,
  Card,
  Checkbox,
  Dropdown,
  Popconfirm,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  UserOutlined,
  ClearOutlined,
  RightOutlined,
  LeftOutlined,
  FileTextOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  DownOutlined,
  MessageOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  CloseOutlined,
  SearchOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAIStore, type Message } from '../store/aiStore';
import { useSkillStore } from '../store/skillStore';
import { usePlanStore } from '../store/planStore';
import { getSystemPrompt, type MultimodalMessage } from '../services/aiService';
import { chatWithTools } from '../services/agentChat';
import { fetchMemory, buildMemoryInjection } from '../services/memoryService';
import { useI18n } from '../i18n';
import type { AIRole, Skill, SkillCategory } from '../types';

const { Content } = Layout;
const { TextArea } = Input;
const { Text, Title } = Typography;

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ============ 项目产物数据 ============
const mockArtifacts = [
  { id: '1', name: '大学生创业BP.md', type: '文档', size: '12KB', date: '2026-07-20', icon: <FileTextOutlined /> },
  { id: '2', name: '产品原型说明.md', type: '文档', size: '8KB', date: '2026-07-22', icon: <FileTextOutlined /> },
  { id: '3', name: '竞品调研报告.md', type: '报告', size: '15KB', date: '2026-07-23', icon: <PieChartOutlined /> },
  { id: '4', name: '路演PPT大纲.md', type: '大纲', size: '5KB', date: '2026-07-25', icon: <FileTextOutlined /> },
];

// ============ 项目进度时间轴数据 ============
interface TimelineItem {
  id: string;
  date: string;
  weekday: string;
  tag: string;
  tagColor: string;
  dotColor: string;
  description: string;
  tasks: { id: string; text: string; done: boolean }[];
}

const mockTimeline: TimelineItem[] = [
  {
    id: '1',
    date: '07-15',
    weekday: '周二',
    tag: '立项',
    tagColor: 'blue',
    dotColor: '#1677ff',
    description: '确定项目方向，组建核心团队',
    tasks: [
      { id: 't1', text: '完成需求调研', done: true },
      { id: 't2', text: '确定技术栈', done: true },
    ],
  },
  {
    id: '2',
    date: '07-18',
    weekday: '周五',
    tag: '调研',
    tagColor: 'cyan',
    dotColor: '#13c2c2',
    description: '完成市场分析和竞品调研',
    tasks: [
      { id: 't3', text: '市场分析报告', done: true },
      { id: 't4', text: '竞品功能对比', done: true },
      { id: 't5', text: '用户访谈记录', done: false },
    ],
  },
  {
    id: '3',
    date: '07-22',
    weekday: '周二',
    tag: '设计',
    tagColor: 'purple',
    dotColor: '#722ed1',
    description: '产品原型设计与评审',
    tasks: [
      { id: 't6', text: '低保真原型', done: true },
      { id: 't7', text: '高保真UI稿', done: false },
    ],
  },
  {
    id: '4',
    date: '07-25',
    weekday: '周五',
    tag: '开发',
    tagColor: 'orange',
    dotColor: '#fa8c16',
    description: '核心功能模块开发中',
    tasks: [
      { id: 't8', text: '搭建项目框架', done: true },
      { id: 't9', text: '完成登录模块', done: false },
      { id: 't10', text: '数据库设计', done: false },
    ],
  },
  {
    id: '5',
    date: '07-28',
    weekday: '周一',
    tag: '测试',
    tagColor: 'green',
    dotColor: '#52c41a',
    description: '内部测试与Bug修复',
    tasks: [
      { id: 't11', text: '编写测试用例', done: false },
      { id: 't12', text: '集成测试', done: false },
    ],
  },
];

// ============ 项目进度：localStorage 持久化 + planStore 同步 ============
const PROGRESS_STORAGE_KEY = 'ai-mate-project-progress';

/** 从 localStorage 加载进度数据 */
function loadProgress(): TimelineItem[] | null {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch { /* ignore */ }
  return null;
}

/** 保存进度数据到 localStorage */
function saveProgress(items: TimelineItem[]) {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

/** 将 planStore 的 PlanStep[] 转换为 TimelineItem[] */
function planStepsToTimeline(steps: import('../store/planStore').PlanStep[]): TimelineItem[] {
  const tagColorMap: Record<string, string> = {
    scout: 'blue', sage: 'purple', maker: 'orange', butler: 'magenta',
  };
  const dotColorMap: Record<string, string> = {
    scout: '#1677ff', sage: '#722ed1', maker: '#fa8c16', butler: '#eb2f96',
  };
  return steps.map((step, idx) => ({
    id: step.id,
    date: new Date(step.startedAt || Date.now() + idx * 86400000).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '-'),
    weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(step.startedAt || Date.now() + idx * 86400000).getDay()],
    tag: step.title.slice(0, 4),
    tagColor: tagColorMap[step.assignedRole] || 'blue',
    dotColor: dotColorMap[step.assignedRole] || '#1677ff',
    description: step.description || step.title,
    tasks: step.acceptance
      ? [{ id: `${step.id}-t1`, text: step.acceptance, done: step.status === 'completed' }]
      : [{ id: `${step.id}-t1`, text: step.title, done: step.status === 'completed' }],
  }));
}

// ============ 右侧侧边栏组件（抽屉式，从页面右侧滑出） ============
const ProjectSidebar: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'artifacts' | 'progress'>('progress');

  // 从 planStore 读取军师AI的项目计划
  const plans = usePlanStore((s) => s.plans);
  const activePlanId = usePlanStore((s) => s.activePlanId);
  const activePlan = plans.find((p) => p.id === activePlanId);

  // 初始化进度数据：localStorage > planStore > mockTimeline
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => {
    const stored = loadProgress();
    if (stored) return stored;
    if (activePlan && activePlan.steps.length > 0) return planStepsToTimeline(activePlan.steps);
    return mockTimeline;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newTaskText, setNewTaskText] = useState<Record<string, string>>({});

  // 当 planStore 更新且 localStorage 无数据时，同步计划
  useEffect(() => {
    if (!loadProgress() && activePlan && activePlan.steps.length > 0) {
      setTimeline(planStepsToTimeline(activePlan.steps));
    }
  }, [activePlan]);

  // 保存到 localStorage
  const persistTimeline = (items: TimelineItem[]) => {
    setTimeline(items);
    saveProgress(items);
  };

  const toggleTask = (itemId: string, taskId: string) => {
    const updated = timeline.map((item) =>
      item.id === itemId
        ? { ...item, tasks: item.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
        : item
    );
    persistTimeline(updated);
  };

  const startEdit = (item: TimelineItem) => {
    setEditingId(item.id);
    setEditText(item.description);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = timeline.map((item) =>
      item.id === editingId ? { ...item, description: editText } : item
    );
    persistTimeline(updated);
    setEditingId(null);
    setEditText('');
  };

  const addTask = (itemId: string) => {
    const text = (newTaskText[itemId] || '').trim();
    if (!text) return;
    const updated = timeline.map((item) =>
      item.id === itemId
        ? { ...item, tasks: [...item.tasks, { id: generateId(), text, done: false }] }
        : item
    );
    persistTimeline(updated);
    setNewTaskText({ ...newTaskText, [itemId]: '' });
  };

  const deleteTask = (itemId: string, taskId: string) => {
    const updated = timeline.map((item) =>
      item.id === itemId
        ? { ...item, tasks: item.tasks.filter((t) => t.id !== taskId) }
        : item
    );
    persistTimeline(updated);
  };

  const deleteTimelineItem = (itemId: string) => {
    const updated = timeline.filter((item) => item.id !== itemId);
    persistTimeline(updated);
  };

  const addTimelineItem = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    const newItem: TimelineItem = {
      id: generateId(),
      date: `${month}-${day}`,
      weekday,
      tag: '新增',
      tagColor: 'default',
      dotColor: '#8c8c8c',
      description: '点击编辑按钮修改描述',
      tasks: [],
    };
    persistTimeline([...timeline, newItem]);
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
          opacity: visible ? 1 : 0,
          visibility: visible ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
          zIndex: 998,
        }}
      />
      {/* 侧边栏面板 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 320,
          height: '100vh',
          background: '#fafafa',
          borderLeft: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 999,
          boxShadow: visible ? '-4px 0 16px rgba(0,0,0,0.08)' : 'none',
        }}
      >
      {/* 标签切换 */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
        <Space>
          <Button
            type={activeTab === 'artifacts' ? 'primary' : 'text'}
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => setActiveTab('artifacts')}
          >
            {t('chat.projectArtifacts')}
          </Button>
          <Button
            type={activeTab === 'progress' ? 'primary' : 'text'}
            size="small"
            icon={<PieChartOutlined />}
            onClick={() => setActiveTab('progress')}
          >
            {t('chat.projectProgress')}
          </Button>
        </Space>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
        {activeTab === 'artifacts' ? (
          <div style={{ padding: '0 16px' }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
              {t('chat.artifactCount', { count: mockArtifacts.length })}
            </Text>
            {mockArtifacts.map((art) => (
              <Card
                key={art.id}
                size="small"
                style={{ marginBottom: 8, cursor: 'pointer' }}
                bodyStyle={{ padding: '10px 12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ color: '#1677ff', fontSize: 18 }}>{art.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text ellipsis style={{ fontSize: 13, fontWeight: 500, display: 'block' }}>
                      {art.name}
                    </Text>
                    <Space size={8}>
                      <Tag color="default" style={{ fontSize: 11, lineHeight: '18px' }}>
                        {art.type}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {art.size}
                      </Text>
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {/* 纵向时间轴 */}
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              {/* 淡紫色装饰竖线 */}
              <div
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  background: 'linear-gradient(180deg, #d3adf7 0%, #b37feb 100%)',
                  borderRadius: 1,
                  opacity: 0.6,
                }}
              />

              {timeline.map((item) => (
                <div key={item.id} style={{ position: 'relative', marginBottom: 20 }}>
                  {/* 彩色实心圆形节点 */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -20 + 4,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: item.dotColor,
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 1px ' + item.dotColor + '40',
                      zIndex: 1,
                    }}
                  />

                  {/* 日期 + 星期 + 编辑按钮 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 13, color: '#333' }}>
                      {item.date}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.weekday}
                    </Text>
                    {/* 圆角彩色标签 */}
                    <Tag
                      color={item.tagColor}
                      style={{ borderRadius: 12, fontSize: 11, padding: '0 8px', margin: 0 }}
                    >
                      {item.tag}
                    </Tag>
                    {/* 编辑按钮 */}
                    {editingId === item.id ? (
                      <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={saveEdit} style={{ fontSize: 11, padding: '0 4px' }} />
                    ) : (
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit(item)} style={{ fontSize: 11, padding: '0 4px', color: '#999' }} />
                    )}
                    {/* 删除整个时间轴节点 */}
                    <Popconfirm
                      title="删除此进度阶段？"
                      description="该阶段下的所有任务将一并删除"
                      onConfirm={() => deleteTimelineItem(item.id)}
                      okText="删除"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        style={{ fontSize: 11, padding: '0 4px', color: '#ccc' }}
                      />
                    </Popconfirm>
                  </div>

                  {/* 描述文字（支持内联编辑） */}
                  {editingId === item.id ? (
                    <Input.TextArea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      onPressEnter={saveEdit}
                      style={{ fontSize: 12, marginBottom: 8 }}
                      autoFocus
                    />
                  ) : (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: 'block',
                        marginBottom: 8,
                        color: '#888',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </Text>
                  )}

                  {/* 任务列表（可勾选 / 删除） */}
                  <div style={{ paddingLeft: 8 }}>
                    {item.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="task-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 0',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleTask(item.id, task.id)}
                      >
                        <Checkbox
                          checked={task.done}
                          style={{ transform: 'scale(0.85)' }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            textDecoration: task.done ? 'line-through' : 'none',
                            color: task.done ? '#aaa' : '#555',
                            flex: 1,
                          }}
                        >
                          {task.text}
                        </Text>
                        <DeleteOutlined
                          style={{ fontSize: 11, color: '#bbb', opacity: 0.5, transition: 'all 0.2s' }}
                          onClick={(e) => { e.stopPropagation(); deleteTask(item.id, task.id); }}
                          className="task-delete-icon"
                        />
                      </div>
                    ))}
                    {/* 添加新任务 */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <Input
                        size="small"
                        placeholder="添加任务..."
                        value={newTaskText[item.id] || ''}
                        onChange={(e) => setNewTaskText({ ...newTaskText, [item.id]: e.target.value })}
                        onPressEnter={() => addTask(item.id)}
                        style={{ fontSize: 12, flex: 1 }}
                      />
                      <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addTask(item.id)} />
                    </div>
                  </div>
                </div>
              ))}
              {/* 新增进度阶段按钮 */}
              <div style={{ paddingLeft: 0, marginTop: 8 }}>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addTimelineItem}
                  style={{ width: '100%', fontSize: 12 }}
                >
                  新增进度阶段
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

// ============ 对话列表下拉菜单组件 ============
interface ConversationDropdownProps {
  conversations: { id: string; title: string }[];
  activeConvId: string | null;
  roleColor: string;
  onSelect: (convId: string) => void;
  onNew: () => void;
  onDelete: (convId: string) => void;
}

const ConversationDropdown: React.FC<ConversationDropdownProps> = ({
  conversations,
  activeConvId,
  roleColor,
  onSelect,
  onNew,
  onDelete,
}) => {
  const { t } = useI18n();
  const items = [
    {
      key: 'header',
      label: (
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
          {t('chat.conversationList', { count: conversations.length })}
        </Text>
      ),
      disabled: true,
    },
    { key: 'divider-top', type: 'divider' as const },
    ...conversations.map((conv) => ({
      key: conv.id,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <MessageOutlined style={{ color: conv.id === activeConvId ? roleColor : '#999', fontSize: 14 }} />
            <Text
              ellipsis
              style={{
                fontSize: 13,
                color: conv.id === activeConvId ? roleColor : '#333',
                fontWeight: conv.id === activeConvId ? 500 : 400,
                maxWidth: 180,
              }}
            >
              {conv.title}
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined style={{ fontSize: 12 }} />}
            style={{ padding: '0 4px', minWidth: 20, height: 20 }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(conv.id);
            }}
          />
        </div>
      ),
      onClick: () => onSelect(conv.id),
    })),
    { key: 'divider-bottom', type: 'divider' as const },
    {
      key: 'new',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusOutlined style={{ color: roleColor, fontSize: 14 }} />
          <Text style={{ fontSize: 13, color: roleColor, fontWeight: 500 }}>{t('chat.newConversation')}</Text>
        </div>
      ),
      onClick: onNew,
    },
  ];

  return (
    <Dropdown
      menu={{ items, style: { maxHeight: 400, overflow: 'auto', width: 280 } }}
      placement="bottomLeft"
      trigger={['click']}
      arrow
    >
      <Button type="primary" icon={<PlusOutlined />} style={{ display: 'flex', alignItems: 'center' }}>
        {t('chat.newChat')}
        <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
      </Button>
    </Dropdown>
  );
};

// ============ 主页面组件 ============
const NewConversation: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateMessage,
    createConversation,
    deleteConversation,
    setActiveConversation,
    clearMessages,
    currentRole,
    setCurrentRole,
  } = useAIStore();

  const { t, lang } = useI18n();

  // 角色选项（标签跟随语言切换）
  const roleOptions = useMemo<{ key: AIRole; label: string; color: string }[]>(
    () => [
      { key: 'scout', label: t('roles.scout'), color: '#1677ff' },
      { key: 'sage', label: t('roles.sage'), color: '#722ed1' },
      { key: 'maker', label: t('roles.maker'), color: '#fa8c16' },
      { key: 'butler', label: t('roles.butler'), color: '#52c41a' },
    ],
    [lang]
  );

  const [inputValue, setInputValue] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [skillQuery, setSkillQuery] = useState('');
  const [skillPanelOpen, setSkillPanelOpen] = useState(false);
  const [skillPanelCategory, setSkillPanelCategory] = useState<SkillCategory | 'all'>('all');
  const [skillPanelQuery, setSkillPanelQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  // Skill 命令触发
  const { skills } = useSkillStore();
  const enabledSkills = skills.filter((s) => s.isEnabled);
  const matchedSkills = skillQuery
    ? enabledSkills.filter(
        (s) =>
          s.triggerCommand.toLowerCase().includes(skillQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(skillQuery.toLowerCase())
      )
    : enabledSkills;

  const panelSkills = skills.filter((s) => {
    const matchCategory = skillPanelCategory === 'all' || s.category === skillPanelCategory;
    const matchQuery =
      !skillPanelQuery ||
      s.name.toLowerCase().includes(skillPanelQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(skillPanelQuery.toLowerCase()) ||
      s.triggerCommand.toLowerCase().includes(skillPanelQuery.toLowerCase());
    return s.isEnabled && matchCategory && matchQuery;
  });

  const activeConvId = activeConversationId[currentRole];
  const activeConv = conversations[currentRole].find((c) => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  const currentRoleInfo = roleOptions.find((r) => r.key === currentRole)!;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息（支持 Skill 命令触发）
  const handleSend = useCallback(async () => {
    let content = inputValue.trim();
    if (!content || isGenerating) return;

    // 解析 Skill 命令：/command args...
    let skillSystemPrompt: string | undefined;
    const skillMatch = enabledSkills.find((s) => content.startsWith(s.triggerCommand + ' '));
    if (skillMatch) {
      const args = content.slice(skillMatch.triggerCommand.length).trim();
      // 将 promptTemplate 中的 {{变量}} 替换为用户输入
      skillSystemPrompt = skillMatch.promptTemplate.replace(/\{\{(\w+)\}\}/g, args);
      content = t('chat.skillTriggered', { name: skillMatch.name, args });
    }

    setInputValue('');
    setIsGenerating(true);
    setSkillDropdownOpen(false);

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(currentRole, userMsg);

    const assistantMsgId = generateId();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      loading: true,
    };
    addMessage(currentRole, assistantMsg);

    try {
      const currentConvId = useAIStore.getState().activeConversationId[currentRole];
      const currentConv = useAIStore.getState().conversations[currentRole].find(
        (c) => c.id === currentConvId
      );
      const allMessages: MultimodalMessage[] = (currentConv?.messages || [])
        .filter((m) => m.id !== assistantMsgId && m.role !== 'tool')
        .map((m): MultimodalMessage => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

      const systemPrompt = skillSystemPrompt || getSystemPrompt(currentRole);

      // 记忆注入（技能触发场景也保持跨会话记忆）
      const memoryData = await fetchMemory(15);
      const memoryInjection = buildMemoryInjection(memoryData, 15);

      // 流式 + 工具调用循环（升级：替代原非流式 chatWithZhipu）
      const result = await chatWithTools(allMessages, {
        systemPrompt,
        memoryInjection,
        token: localStorage.getItem('ai_mate_token') || undefined,
        onChunk: (chunk) => {
          const convId = useAIStore.getState().activeConversationId[currentRole];
          const msg = useAIStore.getState().conversations[currentRole]
            .find((c) => c.id === convId)?.messages.find((m) => m.id === assistantMsgId);
          const next = (msg?.content || '') + chunk;
          updateMessage(currentRole, convId!, assistantMsgId, next);
        },
      });

      // 结束时保证 loading 关闭
      updateMessage(currentRole, currentConvId!, assistantMsgId, result.content || t('chat.replyError'));
    } catch (error) {
      updateMessage(
        currentRole,
        useAIStore.getState().activeConversationId[currentRole]!,
        assistantMsgId,
        t('chat.serviceUnavailable')
      );
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, currentRole, addMessage, updateMessage, setIsGenerating, enabledSkills, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (skillDropdownOpen && matchedSkills.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
        // 让 Dropdown 组件处理这些按键
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // 检测 / 命令触发
    const lastLine = value.split('\n').pop() || '';
    if (lastLine.startsWith('/')) {
      setSkillQuery(lastLine.slice(1));
      setSkillDropdownOpen(true);
    } else {
      setSkillDropdownOpen(false);
      setSkillQuery('');
    }
  };

  const handleSelectSkill = (skill: Skill) => {
    // 将输入中的 /xxx 替换为 skill 的提示词模板占位符提示
    const lines = inputValue.split('\n');
    lines[lines.length - 1] = `${skill.triggerCommand} `;
    setInputValue(lines.join('\n'));
    setSkillDropdownOpen(false);
    setSkillPanelOpen(false);
    setSkillQuery('');
    setSkillPanelQuery('');
    textAreaRef.current?.focus();
  };

  const handleNewConversation = () => {
    createConversation(currentRole);
  };

  const handleDeleteConversation = (convId: string) => {
    deleteConversation(currentRole, convId);
  };

  return (
    <Layout
      className="new-conv-page tool-page tool-dot-bg"
      style={{
        height: '100vh',
        background: '#f5f7fa',
        '--tool-accent': '#1677ff',
        '--tool-accent-glow': 'rgba(22,119,255,0.15)',
      } as React.CSSProperties}
    >
      {/* 胶囊圆角按钮 + 玻璃拟态 + 动画 + 任务删除悬停样式 */}
      <style>{`
        .new-conv-page .ant-btn {
          border-radius: 9999px !important;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .new-conv-page .ant-btn:hover {
          transform: scale(1.03);
        }
        .new-conv-page .ant-btn:active {
          transform: scale(0.97);
        }
        .new-conv-page .ant-btn[type="button"] {
          border-radius: 9999px !important;
        }
        .new-conv-page .ant-input,
        .new-conv-page .ant-input-affix-wrapper {
          border-radius: 9999px !important;
        }
        .new-conv-page .ant-tabs-tab {
          border-radius: 9999px 9999px 0 0 !important;
        }
        .new-conv-page .ant-tag {
          border-radius: 9999px !important;
          padding: 2px 12px !important;
        }
        .new-conv-page .ant-card {
          border-radius: 16px !important;
        }
        .new-conv-page .ant-avatar {
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .new-conv-page .ant-avatar:hover {
          transform: scale(1.08);
        }
        .task-row:hover .task-delete-icon {
          opacity: 1 !important;
          color: #ff4d4f !important;
        }
        .task-delete-icon:hover {
          opacity: 1 !important;
          color: #ff4d4f !important;
          transform: scale(1.2);
        }
        /* 消息气泡入场动画 */
        .new-conv-page .msg-bubble {
          animation: toolFadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        /* 消息气泡悬停增强 */
        .new-conv-page .msg-bubble:hover {
          box-shadow: 0 4px 16px rgba(22,119,255,0.10);
        }
      `}</style>
      {/* 中间主内容区（全宽） */}
      <Layout style={{ height: '100%', overflow: 'hidden' }}>
        <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* 顶部工具栏 — 玻璃拟态 */}
          <div
            className="tool-glass-card tool-fade-in-up"
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.55)',
              borderRadius: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'none',
            }}
          >
            <Space>
              {/* 新对话下拉菜单（包含对话列表） */}
              <ConversationDropdown
                conversations={conversations[currentRole]}
                activeConvId={activeConvId}
                roleColor={currentRoleInfo.color}
                onSelect={(convId) => setActiveConversation(currentRole, convId)}
                onNew={handleNewConversation}
                onDelete={handleDeleteConversation}
              />
              {activeConv && (
                <Text type="secondary" ellipsis style={{ maxWidth: 200, fontSize: 13 }}>
                  {activeConv.title}
                </Text>
              )}
            </Space>
            <Space>
              <Tooltip title={t('chat.clearConversation')}>
                <Button
                  type="text"
                  icon={<ClearOutlined />}
                  onClick={() => clearMessages(currentRole)}
                  disabled={messages.length === 0}
                />
              </Tooltip>
              <Tooltip title={sidebarVisible ? t('chat.hideSidebar') : t('chat.showSidebar')}>
                <Button
                  type="text"
                  icon={sidebarVisible ? <RightOutlined /> : <LeftOutlined />}
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                />
              </Tooltip>
            </Space>
          </div>

          {/* 消息列表 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {messages.length === 0 ? (
              <div
                className="tool-fade-in-up"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 16,
                }}
              >
                <div
                  className="tool-float"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 28,
                    boxShadow: '0 8px 24px rgba(22,119,255,0.20)',
                  }}
                >
                  <MessageOutlined />
                </div>
                <Space direction="vertical" align="center" size={4}>
                  <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
                    {t('chat.startWithRole', { role: currentRoleInfo.label })}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {t('chat.currentRole', { role: currentRoleInfo.label })}
                  </Text>
                </Space>
              </div>
            ) : (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`msg-bubble tool-fade-in-up tool-stagger-${Math.min(index + 1, 9)}`}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 16,
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar
                        icon={currentRoleInfo.label[0]}
                        style={{
                          backgroundColor: currentRoleInfo.color,
                          marginRight: 12,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.role === 'user' ? currentRoleInfo.color : 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: msg.role === 'assistant' ? 'blur(8px)' : undefined,
                        WebkitBackdropFilter: msg.role === 'assistant' ? 'blur(8px)' : undefined,
                        border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.6)' : undefined,
                        color: msg.role === 'user' ? '#fff' : '#333',
                        boxShadow: msg.role === 'user'
                          ? '0 2px 8px rgba(22,119,255,0.15)'
                          : '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      {msg.loading ? (
                        <Spin size="small" />
                      ) : (
                        <Text style={{ color: 'inherit', whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <Avatar
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor: '#87d068',
                          marginLeft: 12,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 输入区域 — 玻璃拟态 */}
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.55)',
              position: 'relative',
            }}
          >
            <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
              {/* Skill 命令下拉提示 — 玻璃拟态 */}
              {skillDropdownOpen && matchedSkills.length > 0 && (
                <div
                  className="tool-glass-card tool-fade-in-up"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 80,
                    marginBottom: 8,
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(22,119,255,0.12)',
                    maxHeight: 240,
                    overflow: 'auto',
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('chat.skillTriggerHint', { count: matchedSkills.length })}
                    </Text>
                  </div>
                  {matchedSkills.slice(0, 8).map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => handleSelectSkill(skill)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderBottom: '1px solid rgba(255,255,255,0.3)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(22,119,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                      <ThunderboltOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 13 }}>
                            {skill.triggerCommand}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#666' }}>{skill.name}</Text>
                        </div>
                        <Text type="secondary" ellipsis style={{ fontSize: 11, maxWidth: '100%' }}>
                          {skill.description}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skill 面板（按钮触发） — 玻璃拟态 */}
              {skillPanelOpen && (
                <div
                  className="tool-glass-card tool-fade-in-up"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    marginBottom: 8,
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(22,119,255,0.12)',
                    maxHeight: 360,
                    overflow: 'auto',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* 头部 — 玻璃拟态 */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      position: 'sticky',
                      top: 0,
                      background: 'rgba(255,255,255,0.6)',
                      zIndex: 1,
                    }}
                  >
                    <Text strong style={{ fontSize: 14 }}>
                      <ThunderboltOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                      {t('chat.skillLibraryTitle', { count: panelSkills.length })}
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => setSkillPanelOpen(false)}
                    />
                  </div>

                  {/* 搜索 + 分类 */}
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                    <Input
                      size="small"
                      placeholder={t('chat.searchSkillPlaceholder')}
                      value={skillPanelQuery}
                      onChange={(e) => setSkillPanelQuery(e.target.value)}
                      prefix={<SearchOutlined />}
                      style={{ marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { key: 'all' },
                        { key: 'analysis' },
                        { key: 'writing' },
                        { key: 'coding' },
                        { key: 'marketing' },
                        { key: 'knowledge' },
                        { key: 'office' },
                        { key: 'design' },
                        { key: 'finance' },
                        { key: 'product' },
                        { key: 'automation' },
                      ].map((cat) => (
                        <Tag
                          key={cat.key}
                          color={skillPanelCategory === cat.key ? '#1677ff' : 'default'}
                          style={{ cursor: 'pointer', fontSize: 12, margin: 0 }}
                          onClick={() => setSkillPanelCategory(cat.key as SkillCategory | 'all')}
                        >
                          {t(`skillLib.cat.${cat.key}`)}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  {/* 技能列表 */}
                  <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
                    {panelSkills.length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('chat.noSkillMatch')} style={{ margin: '20px 0' }} />
                    ) : (
                      panelSkills.map((skill, idx) => (
                        <div
                          key={skill.id}
                          onClick={() => handleSelectSkill(skill)}
                          className={`tool-fade-in-up tool-stagger-${Math.min(idx + 1, 9)}`}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            borderBottom: '1px solid rgba(255,255,255,0.3)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(22,119,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                        >
                          <ThunderboltOutlined style={{ color: '#52c41a', fontSize: 14, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <Text strong style={{ fontSize: 13 }}>
                                {skill.triggerCommand}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#666' }}>{skill.name}</Text>
                              <Tag color="default" style={{ fontSize: 11, lineHeight: '18px', margin: 0 }}>
                                {skill.category}
                              </Tag>
                            </div>
                            <Text type="secondary" ellipsis style={{ fontSize: 11 }}>
                              {skill.description}
                            </Text>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <Space.Compact style={{ width: '100%' }}>
                <Tooltip title={t('chat.selectSkill')}>
                  <Button
                    icon={<ThunderboltOutlined />}
                    onClick={() => setSkillPanelOpen(!skillPanelOpen)}
                    style={{
                      borderRadius: '9999px 0 0 9999px',
                      color: skillPanelOpen ? '#1677ff' : undefined,
                      borderColor: skillPanelOpen ? '#1677ff' : undefined,
                      background: skillPanelOpen ? 'rgba(22,119,255,0.06)' : undefined,
                    }}
                  />
                </Tooltip>
                <TextArea
                  ref={textAreaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.inputPlaceholder', { role: currentRoleInfo.label })}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={isGenerating}
                  style={{ borderRadius: 0 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={isGenerating}
                  disabled={!inputValue.trim()}
                  style={{
                    height: 'auto',
                    borderRadius: '0 9999px 9999px 0',
                    padding: '0 20px',
                    background: 'linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(22,119,255,0.20)',
                  }}
                >
                  {t('chat.send')}
                </Button>
              </Space.Compact>
            </div>
          </div>
        </Content>
      </Layout>

      {/* 右侧项目侧边栏（固定定位抽屉） */}
      <ProjectSidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </Layout>
  );
};

export default NewConversation;
