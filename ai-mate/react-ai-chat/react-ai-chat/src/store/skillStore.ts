/**
 * Skill 库状态管理 (Zustand)
 * 参考 Grok Build Skills 系统设计
 */

import { create } from 'zustand';
import type { Skill, SkillCategory, AutoTrigger } from '../types';

interface SkillStore {
  // 数据
  skills: Skill[];

  // 筛选与搜索
  searchQuery: string;
  activeCategory: SkillCategory | 'all';
  setSearchQuery: (q: string) => void;
  setActiveCategory: (cat: SkillCategory | 'all') => void;

  // CRUD
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  updateSkill: (id: string, patch: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  toggleSkill: (id: string) => void;

  // 使用统计
  incrementUsage: (id: string) => void;

  // 派生数据
  getFilteredSkills: () => Skill[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 默认预设 Skills（参考 Grok Build 的 Skill 发现机制 + SkillHub & RedSkill 平台集成）
const defaultSkills: Skill[] = [
  // ===== 原生 Skills =====
  {
    id: generateId(),
    name: '创业市场调研',
    description: '自动分析目标市场规模、竞品格局和用户痛点',
    category: 'analysis',
    tags: ['analysis'],
    promptTemplate:
      '你是一位资深市场分析师。请针对"{{topic}}"进行深度市场调研，输出：\n1. 市场规模与增长趋势\n2. 核心竞品分析（3-5家）\n3. 目标用户画像\n4. 市场进入策略建议',
    triggerCommand: '/market-research',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '市场调研' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'BP 精炼助手',
    description: '将粗糙的商业想法提炼为结构清晰的 BP 大纲',
    category: 'writing',
    tags: ['writing'],
    promptTemplate:
      '你是一位 BP 撰写专家。请将以下商业想法精炼成一份投资人级别的 BP 大纲：\n\n{{idea}}\n\n要求包含：执行摘要、痛点、解决方案、商业模式、市场规模、竞争壁垒、团队、财务预测、融资需求。',
    triggerCommand: '/bp-refine',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '代码审查',
    description: '审查代码质量、安全性和性能问题',
    category: 'coding',
    tags: ['coding'],
    promptTemplate:
      '你是一位资深技术负责人。请审查以下代码，从可读性、安全性、性能、最佳实践四个维度给出评分和改进建议：\n\n```\n{{code}}\n```',
    triggerCommand: '/code-review',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: 'review my code' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '营销文案生成',
    description: '根据产品特点生成多平台营销文案',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位 growth hacker。请为以下产品生成营销文案：\n\n产品：{{product}}\n卖点：{{sellingPoints}}\n\n输出：\n1. 小红书风格（emoji + 口语化）\n2. 抖音短视频脚本（15秒/30秒/60秒）\n3. 微信公众号推文标题（10个）\n4. B站视频标题和简介',
    triggerCommand: '/marketing-copy',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ===== SkillHub 平台 Skills =====
  // -- 知识管理 --
  {
    id: generateId(),
    name: 'AnySearch 实时搜索',
    description: '支持 Web 搜索、垂直搜索、批量并行搜索与 URL 内容提取',
    category: 'knowledge',
    tags: ['knowledge'],
    promptTemplate:
      '你是一位信息检索专家。请针对查询"{{query}}"执行以下任务：\n1. 分析用户查询意图\n2. 给出结构化搜索结果摘要\n3. 推荐 3-5 个最相关的深入阅读链接\n4. 总结关键信息点',
    triggerCommand: '/anysearch',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '搜索' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '全球文献检索',
    description: '覆盖 8000 万中文期刊与 12 亿全球文献元数据，支持三级检索',
    category: 'knowledge',
    tags: ['knowledge'],
    promptTemplate:
      '你是一位学术文献专家。请针对研究主题"{{topic}}"进行文献检索分析：\n1. 推荐 5-10 篇核心文献（含标题、作者、摘要）\n2. 梳理该领域的研究脉络与演进\n3. 指出当前研究空白与未来方向',
    triggerCommand: '/literature',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // -- 办公效率 --
  {
    id: generateId(),
    name: '智能 PPT 生成',
    description: '多行业多风格 PPT 生成，支持中英文双语与自动配色',
    category: 'office',
    tags: ['office'],
    promptTemplate:
      '你是一位专业 PPT 设计师。请为"{{topic}}"生成一份完整的 PPT 大纲：\n1. 封面标题与副标题\n2. 目录页结构\n3. 每页的内容要点（3-5 个 bullet）\n4. 设计配色建议\n5. 结尾页总结与行动号召',
    triggerCommand: '/ppt-gen',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: 'PPT' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'OCR 文字提取',
    description: '多格式图片与 PDF 文字提取，保留原始格式',
    category: 'office',
    tags: ['office'],
    promptTemplate:
      '你是一位文档处理专家。用户上传了图片/PDF，请：\n1. 提取所有可见文字内容\n2. 保留原文的段落结构和格式\n3. 对模糊或不确定的文字标注 [?]\n4. 输出整理后的文本',
    triggerCommand: '/ocr',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // -- 内容创作 --
  {
    id: generateId(),
    name: '文章去 AI 味',
    description: '去除文本 AI 写作痕迹，修复高频词与机械化表达',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位资深编辑。请将以下文本进行"去 AI 化"改写：\n\n{{text}}\n\n要求：\n1. 替换 AI 高频词汇（如" delve into", " embark on"等）\n2. 增加口语化和个性化表达\n3. 调整句式结构，避免过度工整\n4. 保持原意不变',
    triggerCommand: '/de-ai',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '去AI' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '短视频爆款拆解',
    description: '一键拆解爆款视频结构，输出分段、归因、六维评分',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位短视频运营专家。请对以下视频/链接进行爆款拆解：\n\n{{videoInfo}}\n\n输出：\n1. 视频结构分段（黄金 3 秒、中间、结尾）\n2. 流量归因分析（算法、内容、时机）\n3. 六维评分（选题、文案、画面、节奏、互动、转化）\n4. 可复制策略建议',
    triggerCommand: '/video-deconstruct',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '抖音文案提取',
    description: '从抖音/快手/小红书/视频号链接提取标题、简介、口播文案',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位内容分析专家。请分析以下链接/文案：\n\n{{link}}\n\n输出：\n1. 原始标题与简介\n2. 口播文案全文\n3. 文案结构分析（钩子、正文、CTA）\n4. 改写 3 个不同风格的版本',
    triggerCommand: '/extract-copy',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '番茄小说写作',
    description: '番茄小说平台分章节创作，支持多题材长篇创作',
    category: 'writing',
    tags: ['writing'],
    promptTemplate:
      '你是一位网文作家。请根据以下设定创作小说章节：\n\n题材：{{genre}}\n章节主题：{{theme}}\n字数要求：2200-2800 字\n\n要求：\n1. 节奏紧凑，每 300 字一个爽点或转折\n2. 对话自然，符合人物性格\n3. 结尾留悬念，引导下一章',
    triggerCommand: '/novel-write',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // -- 设计多媒体 --
  {
    id: generateId(),
    name: '架构图生成',
    description: '纯文本驱动架构图生成，支持导出 PPT/SVG',
    category: 'design',
    tags: ['design'],
    promptTemplate:
      '你是一位技术架构师。请为"{{system}}"设计系统架构图：\n1. 用文本符号（ASCII/缩进）绘制架构图\n2. 标注各模块职责与交互关系\n3. 说明技术选型理由\n4. 给出扩展性建议',
    triggerCommand: '/arch-diagram',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '架构图' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '海报设计',
    description: '基于设计哲学生成可渲染 SVG 海报',
    category: 'design',
    tags: ['design'],
    promptTemplate:
      '你是一位平面设计师。请为"{{theme}}"设计海报：\n1. 海报概念与视觉主题\n2. 配色方案（主色、辅色、点缀色）\n3. 版式布局描述\n4. 文案排版建议\n5. 输出 SVG 代码或设计说明',
    triggerCommand: '/poster',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // -- 行业专业 --
  {
    id: generateId(),
    name: '股票价值投资分析',
    description: 'A 股/港股价值投资分析，护城河、财务健康、DCF 估值',
    category: 'finance',
    tags: ['finance'],
    promptTemplate:
      '你是一位价值投资分析师。请对"{{stock}}"进行深度分析：\n1. 护城河分析（品牌、成本、网络效应）\n2. 财务健康度（ROE、现金流、负债率）\n3. DCF 估值模型\n4. 管理层评估\n5. 行业地位与竞争格局\n6. 投资建议与风险提示',
    triggerCommand: '/stock-analysis',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '股票' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // -- 商业运营 --
  {
    id: generateId(),
    name: '产品经理综合技能',
    description: '覆盖需求分析、PRD、KANO、SWOT、商业模式画布、OKR',
    category: 'product',
    tags: ['product'],
    promptTemplate:
      '你是一位产品总监。请针对"{{product}}"进行产品分析：\n1. 需求分析（用户痛点、场景、价值）\n2. PRD 核心要点\n3. KANO 模型分类\n4. SWOT 分析\n5. 商业模式画布\n6. OKR 设定建议',
    triggerCommand: '/pm-master',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '产品经理' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ===== RedSkill 平台 Skills（小红书生态） =====
  {
    id: generateId(),
    name: '小红书深度研究',
    description: '小红书账号/内容/竞品的深度研究分析',
    category: 'analysis',
    tags: ['analysis'],
    promptTemplate:
      '你是一位小红书运营专家。请对"{{account}}"进行深度研究：\n1. 账号定位与内容策略分析\n2. 爆款笔记拆解（选题、封面、文案、标签）\n3. 粉丝画像与互动数据洞察\n4. 竞品对比与差异化建议\n5. 增长策略与变现路径',
    triggerCommand: '/xhs-research',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '小红书' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '小红书内容发布',
    description: '小红书笔记内容生成与发布优化',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位小红书内容创作者。请为"{{topic}}"创作一篇小红书笔记：\n1. 吸睛标题（3 个备选）\n2. 正文内容（emoji 点缀、口语化）\n3. 标签推荐（10-15 个）\n4. 封面图设计建议\n5. 发布时间优化建议',
    triggerCommand: '/xhs-publish',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '小红书笔记' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '小红书 MCP 集成',
    description: '通过 MCP 协议与小红书 API 交互，自动化运营',
    category: 'automation',
    tags: ['automation'],
    promptTemplate:
      '你是一位自动化运营专家。用户希望使用 MCP 协议操作小红书，请：\n1. 说明 MCP 连接配置步骤\n2. 列出可用的 API 操作（发布、查询、互动）\n3. 给出一个自动化工作流示例\n4. 注意事项与风控建议',
    triggerCommand: '/xhs-mcp',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '小红书图片卡片生成',
    description: '小红书封面图、笔记卡片与信息图自动化设计',
    category: 'design',
    tags: ['design'],
    promptTemplate:
      '你是一位小红书视觉设计师。请为"{{topic}}"设计笔记视觉：\n1. 封面图概念与配色\n2. 内页配图建议（3-5 张）\n3. 信息图布局方案\n4. 字体与排版规范\n5. 输出设计稿描述或 SVG 代码',
    triggerCommand: '/xhs-design',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '小红书数据监控',
    description: '小红书账号数据监控与竞品分析',
    category: 'analysis',
    tags: ['analysis'],
    promptTemplate:
      '你是一位数据分析师。请针对小红书账号"{{account}}"输出数据报告：\n1. 粉丝增长趋势\n2. 内容互动率分析\n3. 爆款笔记特征总结\n4. 竞品账号对比\n5. 优化建议与下阶段目标',
    triggerCommand: '/xhs-data',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '小红书评论互动',
    description: '评论自动化回复策略与互动数据分析',
    category: 'automation',
    tags: ['automation'],
    promptTemplate:
      '你是一位社区运营专家。请为小红书笔记制定互动策略：\n1. 评论区引导话术模板\n2. 高频问题自动回复方案\n3. 互动数据分析框架\n4. 用户分层运营建议\n5. 舆情监控与危机处理',
    triggerCommand: '/xhs-interact',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ===== 扩展 Skills（SkillHub 高频） =====
  {
    id: generateId(),
    name: '公众号热门文章查询',
    description: '公众号爆款文章搜索与推荐工具',
    category: 'knowledge',
    tags: ['knowledge'],
    promptTemplate:
      '你是一位内容运营专家。请针对"{{topic}}"查询并推荐公众号热门文章：\n1. 推荐 3-5 篇相关爆款文章（标题、公众号、核心观点）\n2. 分析爆款原因（标题技巧、选题角度、传播时机）\n3. 给出可借鉴的写作框架',
    triggerCommand: '/gzh-search',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '公众号' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '腾讯文档协作',
    description: '腾讯文档官方技能，支持在线文档创建/编辑/读取/搜索/保存',
    category: 'office',
    tags: ['office'],
    promptTemplate:
      '你是一位文档协作专家。用户需要使用腾讯文档处理"{{topic}}"相关文档，请：\n1. 给出文档结构建议\n2. 提供协作流程规范\n3. 推荐模板与排版方案\n4. 说明权限管理与版本控制最佳实践',
    triggerCommand: '/tx-docs',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '金山文档协作',
    description: '金山文档（WPS/365.kdocs.cn）官方技能，支持云端文档新建/读取/编辑/搜索/分享',
    category: 'office',
    tags: ['office'],
    promptTemplate:
      '你是一位 WPS 办公专家。用户需要使用金山文档处理"{{topic}}"相关文档，请：\n1. 给出文档结构建议\n2. 提供协作流程规范\n3. 推荐 WPS 模板与排版方案\n4. 说明云端同步与权限管理最佳实践',
    triggerCommand: '/wps-docs',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '股票舆情智能助手',
    description: '美股行情、期货市场、财联社快讯、宏观国际、资金面与智能结论',
    category: 'finance',
    tags: ['finance'],
    promptTemplate:
      '你是一位金融舆情分析师。请针对"{{stock}}"进行舆情与资金面分析：\n1. 最新市场消息与机构观点汇总\n2. 资金流向与技术面简评\n3. 宏观政策与行业事件影响评估\n4. 短期与中期策略建议\n5. 风险提示',
    triggerCommand: '/stock-sentiment',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '舆情' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'Agently Mail AI Agent',
    description: 'QQ 邮箱团队为 Agent 打造的专属邮箱服务，支持读写邮件、搜索、回复、转发',
    category: 'automation',
    tags: ['automation'],
    promptTemplate:
      '你是一位邮件处理专家。用户需要处理邮件任务：{{task}}\n\n请：\n1. 给出邮件撰写/回复模板\n2. 提供邮件礼仪与沟通策略建议\n3. 说明自动化邮件处理流程\n4. 给出邮件分类与管理方案',
    triggerCommand: '/mail-agent',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '邮件' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '视频号爆款文案生成',
    description: '免费口播脚本生成，按爆款结构产出口播文案',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位短视频文案专家。请为"{{topic}}"生成视频号口播文案：\n1. 黄金 3 秒钩子（3 个备选）\n2. 口播正文（150-300 字）\n3. 结尾 CTA 与引导关注话术\n4. 标签与话题推荐',
    triggerCommand: '/sph-copy',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '视频号' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '爆款内容预检',
    description: '敏感词/广告法检测、模拟观众反应与爆款概率预测',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位内容审核专家。请对以下内容进行爆款预检：\n\n{{content}}\n\n输出：\n1. 敏感词与广告法风险检测\n2. 模拟观众反应（正面/负面/中性）\n3. 爆款概率评分与改进建议\n4. 平台合规性评估',
    triggerCommand: '/content-check',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '预检' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '视频号挂车爆单脚本',
    description: '基于视频号链接生成挂车脚本或原创多条口播脚本',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位电商带货文案专家。请为"{{product}}"生成视频号挂车爆单脚本：\n1. 产品痛点引入（3 秒钩子）\n2. 卖点拆解与使用场景展示\n3. 价格锚点与促单话术\n4. 信任背书与风险逆转\n5. 行动号召与挂车引导',
    triggerCommand: '/sph-sales',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '小红书视频下载分析',
    description: '小红书视频下载与解析，视频内容分析与结构化提取',
    category: 'automation',
    tags: ['automation'],
    promptTemplate:
      '你是一位视频分析专家。用户提供了小红书视频/链接，请：\n1. 提取视频核心内容与结构\n2. 分析画面节奏与剪辑技巧\n3. 总结口播文案与字幕内容\n4. 给出可复用的拍摄与剪辑框架',
    triggerCommand: '/xhs-video',
    autoTriggers: [],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'Web 工具前置指南',
    description: '网页搜索/抓取前置知识管理技能，包含错误处理与 fallback 流程',
    category: 'knowledge',
    tags: ['knowledge'],
    promptTemplate:
      '你是一位网络爬虫与数据获取专家。用户需要获取"{{topic}}"相关网页信息，请：\n1. 给出最佳信息源与搜索策略\n2. 提供网页抓取的技术方案\n3. 说明反爬虫规避与错误处理\n4. 给出数据清洗与结构化建议',
    triggerCommand: '/web-tools',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '网页抓取' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ===== 创业与网站搭建扩展 Skills =====
  {
    id: generateId(),
    name: '商业模式画布生成',
    description: '基于精益创业理念自动生成商业模式画布（BMC）',
    category: 'analysis',
    tags: ['analysis'],
    promptTemplate:
      '你是一位创业战略顾问。请为"{{idea}}"生成完整的商业模式画布：\n1. 客户细分（CS）\n2. 价值主张（VP）\n3. 渠道通路（CH）\n4. 客户关系（CR）\n5. 收入来源（R$）\n6. 核心资源（KR）\n7. 关键业务（KA）\n8. 重要合作（KP）\n9. 成本结构（C$）',
    triggerCommand: '/business-model',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '商业模式' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '融资路演脚本',
    description: '生成投资人路演演讲稿与 PPT 结构，包含黄金 3 分钟钩子',
    category: 'writing',
    tags: ['writing'],
    promptTemplate:
      '你是一位资深 FA 与路演教练。请为"{{project}}"生成融资路演脚本：\n1. 黄金 3 分钟开场钩子\n2. 痛点与机会（Why Now）\n3. 解决方案与产品 Demo 话术\n4. 商业模式与数据亮点\n5. 竞争壁垒与团队优势\n6. 融资规划与资金用途\n7. 结尾行动号召与 Q&A 预案',
    triggerCommand: '/pitch-deck',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '路演' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '股权架构设计',
    description: '创业公司股权分配、期权池设计与合伙人股权协议建议',
    category: 'finance',
    tags: ['finance'],
    promptTemplate:
      '你是一位股权设计专家。请针对"{{company}}"给出股权架构方案：\n1. 创始人股权分配原则与比例建议\n2. 期权池（ESOP）设定（10%-20%）\n3. 合伙人进入/退出机制（Vesting）\n4. 控制权设计（AB股/一致行动人）\n5. 后续融资稀释预判与保护条款',
    triggerCommand: '/equity-design',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '股权' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'MVP 设计与验证',
    description: '最小可行性产品设计、验证方案与 pivot 策略',
    category: 'product',
    tags: ['product'],
    promptTemplate:
      '你是一位精益创业导师。请为"{{idea}}"设计 MVP 方案：\n1. 核心假设提炼（价值假设/增长假设）\n2. MVP 功能清单（必须/最好/将来）\n3. 验证实验设计（访谈/着陆页/假门测试）\n4. 关键指标定义（AARRR 或 North Star）\n5. 迭代节奏与 Pivot 触发条件',
    triggerCommand: '/mvp-design',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: 'MVP' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '创业法律合规检查',
    description: '公司注册、知识产权、数据合规、劳动合同等法律风险扫描',
    category: 'analysis',
    tags: ['analysis'],
    promptTemplate:
      '你是一位专注互联网创业的法律顾问。请针对"{{business}}"进行法律合规检查：\n1. 公司主体选择与注册地建议\n2. 知识产权布局（商标/专利/软著）\n3. 数据合规（隐私政策/用户协议/等保）\n4. 劳动合同与竞业限制\n5. 常见法律风险清单与规避建议',
    triggerCommand: '/legal-check',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '法律合规' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '投资人 Pitch 邮件',
    description: '生成 cold email、跟进邮件与 TS 谈判邮件模板',
    category: 'writing',
    tags: ['writing'],
    promptTemplate:
      '你是一位融资顾问。请为"{{project}}"撰写投资人沟通邮件：\n1. Cold Email（标题 + 正文 + 附件清单）\n2. 首次会面后的跟进邮件\n3. 收到 TS 后的回复与谈判要点\n4. 不同轮次（天使/A轮）的侧重点差异',
    triggerCommand: '/investor-email',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '投资人' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '网站技术选型指南',
    description: '前端框架、后端语言、数据库、云服务选型与架构建议',
    category: 'coding',
    tags: ['coding'],
    promptTemplate:
      '你是一位全栈架构师。用户要搭建"{{projectType}}"网站，请给出技术选型方案：\n1. 前端框架对比与推荐（React/Vue/Next/Nuxt）\n2. 后端语言与框架（Node/Go/Python/Java）\n3. 数据库选型（关系型/文档型/缓存）\n4. 云服务与部署平台（Vercel/阿里云/AWS）\n5. 第三方服务集成（支付/短信/对象存储）\n6. 成本估算与扩展性建议',
    triggerCommand: '/tech-stack',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '技术选型' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '域名与服务器选购',
    description: '域名注册、DNS 配置、服务器/VPS/云主机选购与备案准备',
    category: 'coding',
    tags: ['coding'],
    promptTemplate:
      '你是一位运维与基础设施专家。用户需要为"{{project}}"选购域名与服务器，请：\n1. 域名命名建议与注册平台对比\n2. 服务器类型选择（共享主机/VPS/云服务器/Serverless）\n3. DNS 配置与 CDN 加速方案\n4. 备案材料清单与流程说明\n5. HTTPS 证书申请与配置',
    triggerCommand: '/domain-server',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '域名' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'ICP 备案流程助手',
    description: '中国大陆 ICP 备案全流程指导，含材料模板与常见驳回原因',
    category: 'knowledge',
    tags: ['knowledge'],
    promptTemplate:
      '你是一位备案顾问。请针对"{{website}}"提供 ICP 备案全流程指导：\n1. 备案类型判断（个人/企业/经营性）\n2. 所需材料清单与模板下载建议\n3. 服务商备案入口与操作步骤\n4. 常见驳回原因与修改方案\n5. 备案期间临时上线方案',
    triggerCommand: '/icp-guide',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '备案' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '网站 SEO 优化方案',
    description: '站内优化、关键词策略、外链建设与搜索引擎收录加速',
    category: 'marketing',
    tags: ['marketing'],
    promptTemplate:
      '你是一位 SEO 专家。请为"{{website}}"制定 SEO 优化方案：\n1. 关键词研究与布局（核心词/长尾词/LSI）\n2. 站内优化（TDK/结构/速度/移动适配）\n3. 内容策略与更新频率\n4. 外链建设与社媒引流\n5. 收录加速与站长工具配置\n6. 数据监控与迭代建议',
    triggerCommand: '/seo-optimize',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: 'SEO' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '网站部署与 CI/CD',
    description: '自动化部署流水线、Docker 容器化、GitHub Actions 配置',
    category: 'automation',
    tags: ['automation'],
    promptTemplate:
      '你是一位 DevOps 工程师。请为"{{project}}"设计部署与 CI/CD 方案：\n1. 环境划分（开发/测试/生产）\n2. Docker 容器化与镜像优化\n3. CI/CD 流水线设计（GitHub Actions/GitLab CI）\n4. 自动化测试集成（单元/E2E）\n5. 回滚策略与监控告警\n6. 零停机部署方案',
    triggerCommand: '/deploy-cicd',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '部署' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '前端性能优化审查',
    description: 'Lighthouse 指标分析、资源加载优化、渲染性能与缓存策略',
    category: 'coding',
    tags: ['coding'],
    promptTemplate:
      '你是一位前端性能专家。请审查以下网站/代码的性能问题：\n\n{{codeOrUrl}}\n\n输出：\n1. Lighthouse 核心指标评估（LCP/FID/CLS/TTFB）\n2. 资源加载优化（图片/字体/JS/CSS）\n3. 渲染性能（重排重绘/虚拟列表/懒加载）\n4. 缓存策略与服务 worker\n5. 具体优化建议与优先级排序',
    triggerCommand: '/frontend-perf',
    autoTriggers: [{ id: generateId(), type: 'keyword', condition: '性能优化' }],
    isEnabled: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const STORAGE_KEY = 'ai_mate_skills_v1';

const loadSkillsFromStorage = (): Skill[] | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Skill[];
      // 兼容性：为旧数据补充 tags 字段
      return parsed.map((s) => ({
        ...s,
        tags: s.tags || [s.category],
      }));
    }
  } catch {}
  return null;
};

const saveSkillsToStorage = (skills: Skill[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch {}
};

export const useSkillStore = create<SkillStore>((set, get) => ({
  // 初始数据：优先从 localStorage 加载，否则用默认
  skills: loadSkillsFromStorage() || defaultSkills,

  // 筛选与搜索
  searchQuery: '',
  activeCategory: 'all',
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),

  // CRUD
  addSkill: (skillData) => {
    const newSkill: Skill = {
      ...skillData,
      id: generateId(),
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const nextSkills = [newSkill, ...get().skills];
    saveSkillsToStorage(nextSkills);
    set({ skills: nextSkills });
  },

  updateSkill: (id, patch) => {
    const nextSkills = get().skills.map((s) =>
      s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s
    );
    saveSkillsToStorage(nextSkills);
    set({ skills: nextSkills });
  },

  deleteSkill: (id) => {
    const nextSkills = get().skills.filter((s) => s.id !== id);
    saveSkillsToStorage(nextSkills);
    set({ skills: nextSkills });
  },

  toggleSkill: (id) => {
    const nextSkills = get().skills.map((s) =>
      s.id === id ? { ...s, isEnabled: !s.isEnabled, updatedAt: Date.now() } : s
    );
    saveSkillsToStorage(nextSkills);
    set({ skills: nextSkills });
  },

  // 使用统计
  incrementUsage: (id) => {
    const nextSkills = get().skills.map((s) =>
      s.id === id ? { ...s, usageCount: s.usageCount + 1, updatedAt: Date.now() } : s
    );
    saveSkillsToStorage(nextSkills);
    set({ skills: nextSkills });
  },

  // 派生数据
  getFilteredSkills: () => {
    const { skills, searchQuery, activeCategory } = get();
    return skills.filter((s) => {
      const matchCategory = activeCategory === 'all' || s.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.triggerCommand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  },
}));
