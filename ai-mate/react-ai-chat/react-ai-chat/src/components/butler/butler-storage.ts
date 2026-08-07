/**
 * 管家AI 数据持久化层
 * localStorage 统一管理 + genId + 版本化键名
 */

// ─── 数据类型定义 ───────────────────────────────────────────

// 面板1 — 用户内测
export interface BetaFeedback {
  rating: number;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  aspects: { name: string; score: number }[];
  pros: string[];
  cons: string[];
  createdAt: number;
}

export interface BetaTester {
  id: string;
  name: string;
  avatarColor: string;
  role: string;
  status: 'invited' | 'testing' | 'completed';
  invitedAt: number;
  completedAt?: number;
  feedback?: BetaFeedback;
}

// 面板2 — 进度跟踪
export interface MilestoneTask {
  id: string;
  text: string;
  done: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk';
  startDate: string;
  targetDate: string;
  tasks: MilestoneTask[];
}

export interface ProgressSummary {
  content: string;
  generatedAt: number;
  riskAlerts: string[];
}

// 面板3 — 资源对接
export interface ResourceCard {
  id: string;
  name: string;
  type: 'investor' | 'partner';
  category: string;
  matchScore: number;
  matchReason: string;
  contactMethod: string;
  description: string;
  tags: string[];
  status: 'pending' | 'contacted' | 'negotiating' | 'confirmed';
  createdAt: number;
}

// 面板4 — 团队协作
export interface TeamTask {
  id: string;
  text: string;
  status: 'todo' | 'doing' | 'done';
  order: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  status: 'online' | 'busy' | 'offline';
  taskSequence: string;
  tasks: TeamTask[];
  workload: number;
  skills: string[];
}

export interface TeamMeeting {
  id: string;
  title: string;
  weekIndex: number;
  date: string;
  time: string;
  meetingLink: string;
  type: 'routine' | 'important' | 'review';
  summary?: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

// ─── 键名常量 ───────────────────────────────────────────────

const PREFIX = 'ai-mate-butler';
const VERSION = 'v1';
const K = {
  betaTesters: `${PREFIX}-${VERSION}-beta-testers`,
  milestones: `${PREFIX}-${VERSION}-milestones`,
  progressSummary: `${PREFIX}-${VERSION}-progress-summary`,
  resources: `${PREFIX}-${VERSION}-resources`,
  teamMembers: `${PREFIX}-${VERSION}-team-members`,
  teamMeetings: `${PREFIX}-${VERSION}-team-meetings`,
} as const;

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── 通用 load/save ─────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 静默失败 */
  }
}

// ─── 6 对 load/save 函数 ────────────────────────────────────

export const loadBetaTesters = () => load<BetaTester[]>(K.betaTesters, DEMO_BETA_TESTERS);
export const saveBetaTesters = (v: BetaTester[]) => save(K.betaTesters, v);

export const loadMilestones = () => load<Milestone[]>(K.milestones, DEMO_MILESTONES);
export const saveMilestones = (v: Milestone[]) => save(K.milestones, v);

export const loadProgressSummary = () => load<ProgressSummary | null>(K.progressSummary, null);
export const saveProgressSummary = (v: ProgressSummary) => save(K.progressSummary, v);

export const loadResources = () => load<ResourceCard[]>(K.resources, DEMO_RESOURCES);
export const saveResources = (v: ResourceCard[]) => save(K.resources, v);

export const loadTeamMembers = () => load<TeamMember[]>(K.teamMembers, DEMO_TEAM_MEMBERS);
export const saveTeamMembers = (v: TeamMember[]) => save(K.teamMembers, v);

export const loadTeamMeetings = () => load<TeamMeeting[]>(K.teamMeetings, DEMO_TEAM_MEETINGS);
export const saveTeamMeetings = (v: TeamMeeting[]) => save(K.teamMeetings, v);

// ─── DEMO 数据 ──────────────────────────────────────────────

const now = Date.now();
const dayMs = 86400000;

const DEMO_BETA_TESTERS: BetaTester[] = [
  {
    id: 'beta-1',
    name: '陈思远',
    avatarColor: '#eb2f96',
    role: '大学生创业者',
    status: 'completed',
    invitedAt: now - 14 * dayMs,
    completedAt: now - 7 * dayMs,
    feedback: {
      rating: 5,
      content: '产品界面非常美观，操作流程顺畅。特别喜欢AI对话功能，响应速度快，回答质量高。建议增加离线模式，方便在没有网络时查看历史对话。',
      sentiment: 'positive',
      aspects: [
        { name: '界面设计', score: 95 },
        { name: '操作流畅度', score: 90 },
        { name: '功能完整性', score: 85 },
        { name: '响应速度', score: 92 },
      ],
      pros: ['界面美观大方', 'AI响应速度快', '功能丰富'],
      cons: ['缺少离线模式', '部分按钮位置不够明显'],
      createdAt: now - 7 * dayMs,
    },
  },
  {
    id: 'beta-2',
    name: '林晓彤',
    avatarColor: '#13c2c2',
    role: '产品经理',
    status: 'completed',
    invitedAt: now - 12 * dayMs,
    completedAt: now - 5 * dayMs,
    feedback: {
      rating: 4,
      content: '整体体验不错，BP生成器功能很实用。但在移动端适配方面还有改进空间，希望优化一下小屏幕下的布局。知识库搜索功能很棒，能快速找到需要的资料。',
      sentiment: 'positive',
      aspects: [
        { name: '界面设计', score: 88 },
        { name: '操作流畅度', score: 82 },
        { name: '功能完整性', score: 90 },
        { name: '响应速度', score: 78 },
      ],
      pros: ['BP生成器很实用', '知识库搜索强大', '多角色面板设计好'],
      cons: ['移动端适配需优化', '加载速度偶尔较慢'],
      createdAt: now - 5 * dayMs,
    },
  },
  {
    id: 'beta-3',
    name: '王浩然',
    avatarColor: '#722ed1',
    role: '技术创业者',
    status: 'testing',
    invitedAt: now - 5 * dayMs,
  },
  {
    id: 'beta-4',
    name: '赵雪琪',
    avatarColor: '#faad14',
    role: '设计专业学生',
    status: 'testing',
    invitedAt: now - 3 * dayMs,
  },
  {
    id: 'beta-5',
    name: '刘子轩',
    avatarColor: '#52c41a',
    role: 'MBA学员',
    status: 'invited',
    invitedAt: now - 1 * dayMs,
  },
];

const DEMO_MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    title: '项目立项',
    description: '完成项目立项申请，确定项目方向和核心团队',
    progress: 100,
    status: 'completed',
    startDate: '2026-01-01',
    targetDate: '2026-01-15',
    tasks: [
      { id: 't1', text: '撰写项目立项书', done: true },
      { id: 't2', text: '组建核心团队', done: true },
      { id: 't3', text: '确定技术路线', done: true },
    ],
  },
  {
    id: 'ms-2',
    title: '需求分析',
    description: '完成市场调研和用户需求分析',
    progress: 100,
    status: 'completed',
    startDate: '2026-01-16',
    targetDate: '2026-02-01',
    tasks: [
      { id: 't4', text: '竞品分析报告', done: true },
      { id: 't5', text: '用户访谈记录', done: true },
      { id: 't6', text: '需求文档撰写', done: true },
    ],
  },
  {
    id: 'ms-3',
    title: '产品设计',
    description: '完成UI/UX设计和产品原型',
    progress: 80,
    status: 'in_progress',
    startDate: '2026-02-02',
    targetDate: '2026-03-01',
    tasks: [
      { id: 't7', text: '用户流程图', done: true },
      { id: 't8', text: '高保真原型', done: true },
      { id: 't9', text: '设计规范文档', done: true },
      { id: 't10', text: '交互动效设计', done: false },
    ],
  },
  {
    id: 'ms-4',
    title: '技术开发',
    description: '核心功能开发与联调',
    progress: 45,
    status: 'in_progress',
    startDate: '2026-03-02',
    targetDate: '2026-04-15',
    tasks: [
      { id: 't11', text: '前端框架搭建', done: true },
      { id: 't12', text: '后端API开发', done: true },
      { id: 't13', text: 'AI对话模块', done: false },
      { id: 't14', text: '知识库模块', done: false },
      { id: 't15', text: '前后端联调', done: false },
    ],
  },
  {
    id: 'ms-5',
    title: '测试上线',
    description: '内部测试、Bug修复和正式上线',
    progress: 0,
    status: 'pending',
    startDate: '2026-04-16',
    targetDate: '2026-05-30',
    tasks: [
      { id: 't16', text: '功能测试', done: false },
      { id: 't17', text: '性能测试', done: false },
      { id: 't18', text: '上线部署', done: false },
    ],
  },
];

const DEMO_RESOURCES: ResourceCard[] = [
  {
    id: 'res-1',
    name: '红杉资本中国',
    type: 'investor',
    category: '天使投资人',
    matchScore: 92,
    matchReason: '专注早期科技创业项目，有丰富的AI领域投资经验',
    contactMethod: 'BP投递邮箱：bp@sequoiacap.com',
    description: '红杉资本中国基金，专注于科技/医疗/消费领域的早期投资，投资阶段覆盖种子轮到A轮。',
    tags: ['早期投资', 'AI赛道', '科技'],
    status: 'contacted',
    createdAt: now - 10 * dayMs,
  },
  {
    id: 'res-2',
    name: '创新工场',
    type: 'investor',
    category: '天使投资人',
    matchScore: 85,
    matchReason: '李开复创立，专注AI和教育科技，有完善的创业赋能体系',
    contactMethod: '官网投递：chuangxin.com/apply',
    description: '创新工场由李开复博士创办，投资方向涵盖人工智能、教育科技、企业服务等。',
    tags: ['AI', '教育科技', '创业赋能'],
    status: 'pending',
    createdAt: now - 8 * dayMs,
  },
  {
    id: 'res-3',
    name: '张明（技术合伙人）',
    type: 'partner',
    category: '技术合伙人',
    matchScore: 88,
    matchReason: '10年后端开发经验，曾主导多个SaaS项目，对AI应用有深度理解',
    contactMethod: '微信：zhangming_tech',
    description: '前大厂技术负责人，精通Java/Go/Python，有丰富的团队管理经验，正在寻找创业机会。',
    tags: ['后端架构', 'SaaS', '团队管理'],
    status: 'negotiating',
    createdAt: now - 6 * dayMs,
  },
  {
    id: 'res-4',
    name: '李芳（市场合伙人）',
    type: 'partner',
    category: '市场合伙人',
    matchScore: 78,
    matchReason: '5年互联网市场营销经验，擅长校园推广和社群运营',
    contactMethod: '邮箱：lifang market@email.com',
    description: '前互联网公司市场总监，擅长Growth Hacking和内容营销，有丰富的高校渠道资源。',
    tags: ['市场推广', '校园渠道', '社群运营'],
    status: 'pending',
    createdAt: now - 4 * dayMs,
  },
  {
    id: 'res-5',
    name: '真格基金',
    type: 'investor',
    category: '天使投资人',
    matchScore: 81,
    matchReason: '徐小平创立，专注大学生创业，投资门槛低，流程快',
    contactMethod: '官网投递：zhenfund.com',
    description: '真格基金是国内最早的天使投资机构之一，特别关注大学生和年轻创业者群体。',
    tags: ['天使投资', '大学生创业', '快速决策'],
    status: 'confirmed',
    createdAt: now - 3 * dayMs,
  },
  {
    id: 'res-6',
    name: '王强（设计合伙人）',
    type: 'partner',
    category: '设计合伙人',
    matchScore: 90,
    matchReason: '资深UI/UX设计师，曾负责多个百万用户级产品设计',
    contactMethod: '微信：wangqiang_design',
    description: '前互联网大厂设计总监，精通产品设计和品牌视觉，有丰富的设计团队搭建经验。',
    tags: ['UI/UX', '品牌设计', '团队搭建'],
    status: 'contacted',
    createdAt: now - 2 * dayMs,
  },
];

const DEMO_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: '张三',
    role: '产品经理',
    avatarColor: '#eb2f96',
    status: 'online',
    taskSequence: `## 本周任务清单

1. **完成PRD文档终稿** — 整理用户反馈，更新功能优先级
2. **组织需求评审会** — 邀请开发和设计参加，确认开发范围
3. **跟进开发进度** — 每日站会同步，识别阻塞点
4. **准备内测方案** — 确定内测用户名单，设计反馈问卷`,
    tasks: [
      { id: 'tt1', text: '完成PRD文档终稿', status: 'done', order: 1 },
      { id: 'tt2', text: '组织需求评审会', status: 'doing', order: 2 },
      { id: 'tt3', text: '跟进开发进度', status: 'doing', order: 3 },
      { id: 'tt4', text: '准备内测方案', status: 'todo', order: 4 },
    ],
    workload: 65,
    skills: ['需求分析', '项目管理', '用户研究'],
  },
  {
    id: 'tm-2',
    name: '李四',
    role: '前端开发',
    avatarColor: '#13c2c2',
    status: 'busy',
    taskSequence: `## 本周任务清单

1. **AI对话界面开发** — 完成聊天列表和消息气泡组件
2. **知识库面板对接** — 接入后端API，实现搜索和引用功能
3. **响应式适配** — 优化移动端布局，处理小屏幕适配
4. **Bug修复** — 修复内测反馈的5个前端问题`,
    tasks: [
      { id: 'tt5', text: 'AI对话界面开发', status: 'done', order: 1 },
      { id: 'tt6', text: '知识库面板对接', status: 'doing', order: 2 },
      { id: 'tt7', text: '响应式适配', status: 'todo', order: 3 },
      { id: 'tt8', text: 'Bug修复', status: 'todo', order: 4 },
    ],
    workload: 85,
    skills: ['React', 'TypeScript', 'Ant Design'],
  },
  {
    id: 'tm-3',
    name: '王五',
    role: '后端开发',
    avatarColor: '#722ed1',
    status: 'online',
    taskSequence: `## 本周任务清单

1. **AI服务接口优化** — 接入流式响应，优化超时处理
2. **知识库检索引擎** — 实现中文分词和加权评分
3. **数据库设计** — 设计用户和项目数据表结构
4. **API文档编写** — 补充接口文档，方便前端对接`,
    tasks: [
      { id: 'tt9', text: 'AI服务接口优化', status: 'done', order: 1 },
      { id: 'tt10', text: '知识库检索引擎', status: 'done', order: 2 },
      { id: 'tt11', text: '数据库设计', status: 'doing', order: 3 },
      { id: 'tt12', text: 'API文档编写', status: 'todo', order: 4 },
    ],
    workload: 70,
    skills: ['Node.js', 'Python', '数据库设计'],
  },
  {
    id: 'tm-4',
    name: '赵六',
    role: 'UI设计师',
    avatarColor: '#faad14',
    status: 'offline',
    taskSequence: `## 本周任务清单

1. **设计系统迭代** — 更新色彩规范和组件库
2. **新增页面设计** — 完成管家AI四面板高保真稿
3. **交互动效设计** — 设计面板切换和卡片入场动画
4. **设计走查** — 检查前端实现还原度`,
    tasks: [
      { id: 'tt13', text: '设计系统迭代', status: 'done', order: 1 },
      { id: 'tt14', text: '新增页面设计', status: 'done', order: 2 },
      { id: 'tt15', text: '交互动效设计', status: 'doing', order: 3 },
      { id: 'tt16', text: '设计走查', status: 'todo', order: 4 },
    ],
    workload: 55,
    skills: ['UI设计', 'Figma', '动效设计'],
  },
];

const DEMO_TEAM_MEETINGS: TeamMeeting[] = [
  {
    id: 'meet-1',
    title: '第8周项目周会',
    weekIndex: 8,
    date: '2026-03-02',
    time: '10:00-11:00',
    meetingLink: 'https://meeting.tencent.com/dm/xxxxx',
    type: 'routine',
    attendees: ['张三', '李四', '王五', '赵六'],
    status: 'completed',
    summary: `## 会议总结

### 讨论要点
- 本周开发进度：AI对话模块已完成80%，知识库模块已完成60%
- 内测反馈收集：已收到5位用户的反馈，整体满意度4.5/5
- 设计走查：发现3个还原度问题，已记录待修复

### 决议事项
- 优先修复内测反馈的高优先级Bug
- 下周开始响应式适配工作
- 增加知识库搜索结果的数量限制配置

### 行动项
| 负责人 | 事项 | 截止日期 |
|--------|------|---------|
| 李四 | 修复5个前端Bug | 2026-03-05 |
| 王五 | 优化AI接口超时处理 | 2026-03-04 |
| 赵六 | 完成交互动效设计 | 2026-03-06 |`,
  },
  {
    id: 'meet-2',
    title: '第9周产品评审会',
    weekIndex: 9,
    date: '2026-03-09',
    time: '14:00-15:30',
    meetingLink: 'https://meeting.tencent.com/dm/yyyyy',
    type: 'important',
    attendees: ['张三', '李四', '王五'],
    status: 'scheduled',
  },
  {
    id: 'meet-3',
    title: '第9周技术分享',
    weekIndex: 9,
    date: '2026-03-11',
    time: '16:00-17:00',
    meetingLink: 'https://meeting.tencent.com/dm/zzzzz',
    type: 'review',
    attendees: ['李四', '王五'],
    status: 'scheduled',
  },
];
