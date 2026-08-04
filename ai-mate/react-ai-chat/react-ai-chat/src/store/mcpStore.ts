/**
 * MCP 服务器配置状态管理 (Zustand)
 * 支持 localStorage 持久化 + 丰富的预设服务器模板
 */

import { create } from 'zustand';
import type { MCPServer, MCPTool, MCPStatus } from '../types';

// ============ 常量 ============

const MCP_STORAGE_KEY = 'ai-mate-mcp-servers';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ============ MCP 服务器模板类型 ============

export type MCPCategory =
  | 'development'
  | 'data'
  | 'communication'
  | 'productivity'
  | 'ai'
  | 'media'
  | 'finance'
  | 'custom';

export const MCP_CATEGORY_LABELS: Record<MCPCategory, string> = {
  development: '开发工具',
  data: '数据服务',
  communication: '通讯协作',
  productivity: '效率工具',
  ai: 'AI 能力',
  media: '媒体内容',
  finance: '金融服务',
  custom: '自定义',
};

export const MCP_CATEGORY_COLORS: Record<MCPCategory, string> = {
  development: 'blue',
  data: 'cyan',
  communication: 'green',
  productivity: 'purple',
  ai: 'orange',
  media: 'magenta',
  finance: 'gold',
  custom: 'default',
};

export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  category: MCPCategory;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  tools: MCPTool[];
  /** 官方文档链接 */
  docUrl?: string;
  /** 需要的环境变量说明 */
  envHints?: { key: string; description: string; required: boolean }[];
  popular?: boolean;
}

// ============ 预设服务器模板 ============

export const MCP_TEMPLATES: MCPServerTemplate[] = [
  // --- 开发工具 ---
  {
    id: 'tpl-filesystem',
    name: '文件系统工具',
    description: '读写本地文件、列出目录内容，适合本地项目操作',
    category: 'development',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
    tools: [
      { name: 'read_file', description: '读取文件内容', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
      { name: 'write_file', description: '写入文件内容', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } } },
      { name: 'list_directory', description: '列出目录内容', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
    ],
    popular: true,
  },
  {
    id: 'tpl-github',
    name: 'GitHub 集成',
    description: '搜索仓库、管理 Issue 和 PR，与 GitHub 深度集成',
    category: 'development',
    transport: 'sse',
    url: 'http://localhost:3001/sse',
    envHints: [
      { key: 'GITHUB_TOKEN', description: 'GitHub Personal Access Token', required: true },
    ],
    tools: [
      { name: 'search_repos', description: '搜索 GitHub 仓库', inputSchema: {} },
      { name: 'create_issue', description: '创建 Issue', inputSchema: {} },
      { name: 'list_prs', description: '列出 Pull Requests', inputSchema: {} },
    ],
    popular: true,
  },
  {
    id: 'tpl-git',
    name: 'Git 版本控制',
    description: '执行 Git 操作：查看日志、diff、提交、分支管理',
    category: 'development',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    tools: [
      { name: 'git_log', description: '查看提交历史', inputSchema: {} },
      { name: 'git_diff', description: '查看文件差异', inputSchema: {} },
      { name: 'git_status', description: '查看仓库状态', inputSchema: {} },
    ],
  },
  {
    id: 'tpl-puppeteer',
    name: 'Puppeteer 浏览器',
    description: '无头浏览器自动化，网页截图、数据抓取、UI 测试',
    category: 'development',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    tools: [
      { name: 'navigate', description: '导航到指定 URL', inputSchema: {} },
      { name: 'screenshot', description: '页面截图', inputSchema: {} },
      { name: 'click', description: '点击元素', inputSchema: {} },
      { name: 'fill', description: '填写表单', inputSchema: {} },
      { name: 'evaluate', description: '执行 JavaScript', inputSchema: {} },
    ],
    popular: true,
  },
  // --- 数据服务 ---
  {
    id: 'tpl-postgres',
    name: 'PostgreSQL 数据库',
    description: '连接 PostgreSQL 数据库，执行 SQL 查询和管理操作',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    envHints: [
      { key: 'DATABASE_URL', description: 'PostgreSQL 连接字符串', required: true },
    ],
    tools: [
      { name: 'query', description: '执行 SQL 查询', inputSchema: {} },
      { name: 'list_tables', description: '列出所有表', inputSchema: {} },
      { name: 'describe_table', description: '查看表结构', inputSchema: {} },
    ],
    popular: true,
  },
  {
    id: 'tpl-sqlite',
    name: 'SQLite 数据库',
    description: '连接本地 SQLite 数据库文件，轻量级数据查询',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', './data.db'],
    tools: [
      { name: 'query', description: '执行 SQL 查询', inputSchema: {} },
      { name: 'list_tables', description: '列出所有表', inputSchema: {} },
    ],
  },
  {
    id: 'tpl-brave-search',
    name: 'Brave 搜索',
    description: '通过 Brave Search API 进行网络搜索和本地搜索',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    envHints: [
      { key: 'BRAVE_API_KEY', description: 'Brave Search API 密钥', required: true },
    ],
    tools: [
      { name: 'web_search', description: '网络搜索', inputSchema: {} },
      { name: 'local_search', description: '本地搜索', inputSchema: {} },
    ],
    popular: true,
  },
  // --- 通讯协作 ---
  {
    id: 'tpl-slack',
    name: 'Slack 集成',
    description: '发送消息、管理频道、搜索历史记录，与 Slack 工作区集成',
    category: 'communication',
    transport: 'sse',
    url: 'http://localhost:3002/sse',
    envHints: [
      { key: 'SLACK_BOT_TOKEN', description: 'Slack Bot OAuth Token', required: true },
      { key: 'SLACK_TEAM_ID', description: 'Slack Team/Workspace ID', required: true },
    ],
    tools: [
      { name: 'send_message', description: '发送消息到频道', inputSchema: {} },
      { name: 'list_channels', description: '列出频道', inputSchema: {} },
      { name: 'search_messages', description: '搜索消息', inputSchema: {} },
    ],
  },
  {
    id: 'tpl-discord',
    name: 'Discord 集成',
    description: '管理 Discord 服务器、发送消息、管理频道',
    category: 'communication',
    transport: 'sse',
    url: 'http://localhost:3003/sse',
    envHints: [
      { key: 'DISCORD_BOT_TOKEN', description: 'Discord Bot Token', required: true },
    ],
    tools: [
      { name: 'send_message', description: '发送消息', inputSchema: {} },
      { name: 'list_guilds', description: '列出服务器', inputSchema: {} },
      { name: 'list_channels', description: '列出频道', inputSchema: {} },
    ],
  },
  // --- 效率工具 ---
  {
    id: 'tpl-memory',
    name: '记忆存储',
    description: '基于知识图谱的持久化记忆系统，让 AI 记住上下文和用户偏好',
    category: 'productivity',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    tools: [
      { name: 'create_entities', description: '创建记忆实体', inputSchema: {} },
      { name: 'create_relations', description: '创建实体关系', inputSchema: {} },
      { name: 'search_memory', description: '搜索记忆', inputSchema: {} },
      { name: 'read_graph', description: '读取知识图谱', inputSchema: {} },
    ],
    popular: true,
  },
  {
    id: 'tpl-sequential-thinking',
    name: '顺序思维',
    description: '结构化动态反思式问题解决，适合复杂分析和逐步推理',
    category: 'productivity',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    tools: [
      { name: 'sequentialthinking', description: '逐步思考分析', inputSchema: {} },
    ],
    popular: true,
  },
  {
    id: 'tpl-notion',
    name: 'Notion 集成',
    description: '读写 Notion 页面和数据库，管理知识库',
    category: 'productivity',
    transport: 'sse',
    url: 'http://localhost:3004/sse',
    envHints: [
      { key: 'NOTION_API_KEY', description: 'Notion Integration Token', required: true },
    ],
    tools: [
      { name: 'search_pages', description: '搜索页面', inputSchema: {} },
      { name: 'read_page', description: '读取页面内容', inputSchema: {} },
      { name: 'create_page', description: '创建页面', inputSchema: {} },
      { name: 'query_database', description: '查询数据库', inputSchema: {} },
    ],
  },
  // --- AI 能力 ---
  {
    id: 'tpl-openai',
    name: 'OpenAI 嵌入',
    description: '调用 OpenAI Embedding API 生成文本向量，用于语义搜索',
    category: 'ai',
    transport: 'sse',
    url: 'http://localhost:3005/sse',
    envHints: [
      { key: 'OPENAI_API_KEY', description: 'OpenAI API Key', required: true },
    ],
    tools: [
      { name: 'embed_text', description: '生成文本嵌入向量', inputSchema: {} },
    ],
  },
  // --- 媒体内容 ---
  {
    id: 'tpl-youtube',
    name: 'YouTube 工具',
    description: '搜索 YouTube 视频、获取字幕、提取视频信息',
    category: 'media',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-youtube'],
    envHints: [
      { key: 'YOUTUBE_API_KEY', description: 'YouTube Data API Key', required: false },
    ],
    tools: [
      { name: 'search', description: '搜索视频', inputSchema: {} },
      { name: 'get_captions', description: '获取字幕', inputSchema: {} },
      { name: 'get_info', description: '获取视频信息', inputSchema: {} },
    ],
  },
];

// ============ Store 类型定义 ============

interface MCPStore {
  // 数据
  servers: MCPServer[];

  // CRUD
  addServer: (server: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tools'>) => void;
  addServerFromTemplate: (tpl: MCPServerTemplate) => void;
  updateServer: (id: string, patch: Partial<MCPServer>) => void;
  removeServer: (id: string) => void;
  duplicateServer: (id: string) => void;

  // 连接状态
  setServerStatus: (id: string, status: MCPStatus) => void;
  setServerTools: (id: string, tools: MCPTool[]) => void;

  // 测试连接
  testConnection: (id: string) => Promise<boolean>;

  // JSON 导入导出
  importFromJson: (jsonString: string) => void;
  exportToJson: (id: string) => string;
  exportAllToJson: () => string;

  // 批量操作
  batchRemove: (ids: string[]) => void;

  // 持久化
  _loadFromStorage: () => void;
  _saveToStorage: () => void;
}

// ============ 持久化辅助 ============

const loadServersFromStorage = (): MCPServer[] | null => {
  try {
    const raw = localStorage.getItem(MCP_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
};

const saveServersToStorage = (servers: MCPServer[]) => {
  try {
    localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify(servers));
  } catch {
    // ignore
  }
};

// ============ 初始服务器（仅首次使用时无持久化数据的回退） ============

const createDefaultServers = (): MCPServer[] => [
  {
    id: generateId(),
    name: '文件系统工具',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
    env: {},
    status: 'disconnected',
    tools: [
      { name: 'read_file', description: '读取文件内容', inputSchema: {} },
      { name: 'write_file', description: '写入文件内容', inputSchema: {} },
      { name: 'list_directory', description: '列出目录内容', inputSchema: {} },
    ],
    configJson: JSON.stringify(
      { name: '文件系统工具', transport: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'] },
      null, 2
    ),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'GitHub 集成',
    transport: 'sse',
    url: 'http://localhost:3001/sse',
    status: 'disconnected',
    tools: [
      { name: 'search_repos', description: '搜索 GitHub 仓库', inputSchema: {} },
      { name: 'create_issue', description: '创建 Issue', inputSchema: {} },
    ],
    configJson: JSON.stringify(
      { name: 'GitHub 集成', transport: 'sse', url: 'http://localhost:3001/sse' },
      null, 2
    ),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ============ Store 实现 ============

export const useMCPStore = create<MCPStore>((set, get) => {
  // 初始化：优先从 localStorage 加载
  const stored = loadServersFromStorage();
  const initialServers = stored || createDefaultServers();

  return {
    servers: initialServers,

    // 持久化写入
    _saveToStorage: () => {
      saveServersToStorage(get().servers);
    },

    _loadFromStorage: () => {
      const data = loadServersFromStorage();
      if (data) set({ servers: data });
    },

    // CRUD
    addServer: (serverData) => {
      const newServer: MCPServer = {
        ...serverData,
        id: generateId(),
        status: 'disconnected',
        tools: (serverData as MCPServer).tools || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((draft) => ({ servers: [newServer, ...draft.servers] }));
      saveServersToStorage(get().servers);
    },

    addServerFromTemplate: (tpl) => {
      const configObj: Record<string, unknown> = {
        name: tpl.name,
        transport: tpl.transport,
        ...(tpl.command ? { command: tpl.command } : {}),
        ...(tpl.args ? { args: tpl.args } : {}),
        ...(tpl.url ? { url: tpl.url } : {}),
      };
      const newServer: MCPServer = {
        id: generateId(),
        name: tpl.name,
        transport: tpl.transport,
        command: tpl.command,
        args: tpl.args,
        url: tpl.url,
        env: tpl.env || {},
        status: 'disconnected',
        tools: tpl.tools,
        configJson: JSON.stringify(configObj, null, 2),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((draft) => ({ servers: [newServer, ...draft.servers] }));
      saveServersToStorage(get().servers);
    },

    updateServer: (id, patch) => {
      set((draft) => ({
        servers: draft.servers.map((s) =>
          s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s
        ),
      }));
      saveServersToStorage(get().servers);
    },

    removeServer: (id) => {
      set((draft) => ({ servers: draft.servers.filter((s) => s.id !== id) }));
      saveServersToStorage(get().servers);
    },

    duplicateServer: (id) => {
      const source = get().servers.find((s) => s.id === id);
      if (!source) return;
      const copy: MCPServer = {
        ...source,
        id: generateId(),
        name: `${source.name} (副本)`,
        status: 'disconnected',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((draft) => ({ servers: [copy, ...draft.servers] }));
      saveServersToStorage(get().servers);
    },

    // 连接状态
    setServerStatus: (id, status) => {
      set((draft) => ({
        servers: draft.servers.map((s) =>
          s.id === id ? { ...s, status, updatedAt: Date.now() } : s
        ),
      }));
    },

    setServerTools: (id, tools) => {
      set((draft) => ({
        servers: draft.servers.map((s) =>
          s.id === id ? { ...s, tools, updatedAt: Date.now() } : s
        ),
      }));
      saveServersToStorage(get().servers);
    },

    // 测试连接（模拟异步，后续可替换为真实连接逻辑）
    testConnection: async (id) => {
      const server = get().servers.find((s) => s.id === id);
      if (!server) return false;

      set((draft) => ({
        servers: draft.servers.map((s) =>
          s.id === id ? { ...s, status: 'connecting' as MCPStatus } : s
        ),
      }));

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 模拟 85% 成功率
      const success = Math.random() > 0.15;
      const newStatus: MCPStatus = success ? 'connected' : 'error';

      set((draft) => ({
        servers: draft.servers.map((s) =>
          s.id === id ? { ...s, status: newStatus, updatedAt: Date.now() } : s
        ),
      }));
      saveServersToStorage(get().servers);

      return success;
    },

    // JSON 导入
    importFromJson: (jsonString) => {
      const parsed = JSON.parse(jsonString);
      const serversToImport = Array.isArray(parsed) ? parsed : [parsed];

      serversToImport.forEach((s: Record<string, unknown>) => {
        const newServer: MCPServer = {
          id: generateId(),
          name: (s.name as string) || '未命名服务器',
          transport: (s.transport as 'stdio' | 'sse') || 'stdio',
          command: s.command as string | undefined,
          args: s.args as string[] | undefined,
          env: (s.env as Record<string, string>) || undefined,
          url: s.url as string | undefined,
          status: 'disconnected',
          tools: [],
          configJson: JSON.stringify(s, null, 2),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((draft) => ({ servers: [newServer, ...draft.servers] }));
      });
      saveServersToStorage(get().servers);
    },

    // JSON 导出（单个）
    exportToJson: (id) => {
      const server = get().servers.find((s) => s.id === id);
      if (!server) return '{}';
      return server.configJson;
    },

    // JSON 导出（全部）
    exportAllToJson: () => {
      return JSON.stringify(get().servers.map((s) => JSON.parse(s.configJson)), null, 2);
    },

    // 批量删除
    batchRemove: (ids) => {
      const idSet = new Set(ids);
      set((draft) => ({ servers: draft.servers.filter((s) => !idSet.has(s.id)) }));
      saveServersToStorage(get().servers);
    },
  };
});
