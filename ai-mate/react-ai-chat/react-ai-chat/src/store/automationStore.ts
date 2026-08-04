/**
 * 自动化规则状态管理 (Zustand)
 * 规则与日志持久化到 localStorage；执行走真实后端调度器（server.js cron）。
 * 参考 EvoFlow AutomationScheduler：schedule 触发由后端 tick 扫描，
 * 前端负责规则编辑与手动触发（传递模型配置）。
 */

import { create } from 'zustand';
import { useAIStore } from './aiStore';
import type {
  AutomationRule,
  AutomationAction,
  TriggerConfig,
  ExecutionLog,
  ActionType,
} from '../types';

interface AutomationStore {
  // 数据
  rules: AutomationRule[];
  executionLogs: ExecutionLog[];
  showDisabled: boolean;
  schedulerEnabled: boolean;

  // 筛选
  setShowDisabled: (show: boolean) => void;

  // CRUD
  addRule: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRule: (id: string, patch: Partial<AutomationRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;

  // 执行（真实后端）
  executeRule: (id: string, context?: Record<string, unknown>) => Promise<boolean>;
  addExecutionLog: (log: Omit<ExecutionLog, 'id' | 'executedAt'>) => void;
  /** 从后端同步规则与日志（页面加载时调用） */
  syncFromBackend: () => Promise<void>;

  // 派生数据
  getVisibleRules: () => AutomationRule[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const RULES_KEY = 'ai-mate-automation-rules-v1';
const LOGS_KEY = 'ai-mate-automation-logs-v1';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const loadRules = (): AutomationRule[] => {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadLogs = (): ExecutionLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量超限静默
  }
};

// 默认示例规则（仅首次初始化时使用）
const defaultRules: AutomationRule[] = [
  {
    id: generateId(),
    name: '对话开场白',
    description: '每次开始新对话时，自动发送一段上下文引导',
    isEnabled: true,
    trigger: {
      type: 'conversation-start',
      config: { roles: ['scout', 'sage'] },
    },
    actions: [
      {
        id: generateId(),
        type: 'send-message',
        config: {
          content:
            '你好！我是你的 AI 创业助手。今天有什么我可以帮你的？无论是市场调研、BP撰写还是代码审查，我都可以协助。',
          role: 'assistant',
        },
      },
    ],
    maxIterations: 1,
    runMode: 'sequential',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '关键词触发 Skill',
    description: '当用户消息包含"/bp"时自动调用 BP 精炼 Skill',
    isEnabled: false,
    trigger: {
      type: 'message-keyword',
      config: { keywords: ['/bp', '商业计划书'], matchScope: 'user' },
    },
    actions: [
      {
        id: generateId(),
        type: 'invoke-skill',
        config: { skillId: 'bp-refine', variables: { idea: '{{userMessage}}' } },
      },
    ],
    maxIterations: 1,
    runMode: 'sequential',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    name: '每日晨报',
    description: '每天早上 9 点自动推送创业早报',
    isEnabled: false,
    trigger: {
      type: 'schedule',
      config: { cron: '0 9 * * *', timezone: 'Asia/Shanghai' },
    },
    actions: [
      {
        id: generateId(),
        type: 'send-message',
        config: {
          content: '【创业早报】今天是 {{date}}，为你推送今日创业资讯...',
          role: 'assistant',
        },
      },
    ],
    maxIterations: 1,
    runMode: 'sequential',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const useAutomationStore = create<AutomationStore>((set, get) => {
  const initialRules = loadRules();
  const initialLogs = loadLogs();

  return {
    // 初始数据
    rules: initialRules.length > 0 ? initialRules : defaultRules,
    executionLogs: initialLogs,
    showDisabled: false,
    schedulerEnabled: true,

    // 筛选
    setShowDisabled: (show) => set({ showDisabled: show }),

    // CRUD
    addRule: (ruleData) => {
      const newRule: AutomationRule = {
        ...ruleData,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((draft) => {
        const rules = [newRule, ...draft.rules];
        persist(RULES_KEY, rules);
        return { rules };
      });
    },

    updateRule: (id, patch) => {
      set((draft) => {
        const rules = draft.rules.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r
        );
        persist(RULES_KEY, rules);
        return { rules };
      });
    },

    deleteRule: (id) => {
      set((draft) => {
        const rules = draft.rules.filter((r) => r.id !== id);
        persist(RULES_KEY, rules);
        return { rules };
      });
    },

    toggleRule: (id) => {
      set((draft) => {
        const rules = draft.rules.map((r) =>
          r.id === id ? { ...r, isEnabled: !r.isEnabled, updatedAt: Date.now() } : r
        );
        persist(RULES_KEY, rules);
        return { rules };
      });
    },

    // 执行：调用后端真实执行器
    executeRule: async (id, context) => {
      const rule = get().rules.find((r) => r.id === id);
      if (!rule || !rule.isEnabled) return false;

      const logEntry: ExecutionLog = {
        id: generateId(),
        ruleId: id,
        ruleName: rule.name,
        status: 'running',
        message: `正在执行规则: ${rule.name}`,
        executedAt: Date.now(),
      };

      set((draft) => {
        const logs = [logEntry, ...draft.executionLogs].slice(0, 50);
        persist(LOGS_KEY, logs);
        return { executionLogs: logs };
      });

      try {
        // 获取当前启用模型配置
        const modelConfigs = useAIStore.getState().modelConfigs;
        const enabled = modelConfigs.find((c) => c.isEnabled);
        const modelConfig = enabled
          ? {
              modelId: enabled.modelId || enabled.name,
              baseUrl: enabled.baseUrl || 'https://ark.cn-beijing.volces.com/api/plan/v3',
              apiKey: enabled.apiKey,
              multimodal: enabled.multimodal,
            }
          : undefined;

        const resp = await fetch(`${API_BASE}/automation/rules/${id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model_config: modelConfig, context: context || {} }),
        });
        const json = await resp.json().catch(() => null);
        const data = json?.data;

        const success = !!data && !data.error;
        const status: ExecutionLog['status'] = success ? 'success' : 'failed';
        const message = data?.error
          ? `规则 "${rule.name}" 执行失败：${data.error}`
          : data?.log?.message || `规则 "${rule.name}" 执行${success ? '成功' : '完成'}`;

        set((draft) => {
          const logs = draft.executionLogs
            .map((l) => (l.id === logEntry.id ? { ...l, status, message } : l))
            .slice(0, 50);
          persist(LOGS_KEY, logs);
          return { executionLogs: logs };
        });

        return success;
      } catch (err) {
        const message = `规则 "${rule.name}" 执行失败：${err instanceof Error ? err.message : '后端不可用'}`;
        set((draft) => {
          const logs = draft.executionLogs
            .map((l) => (l.id === logEntry.id ? { ...l, status: 'failed' as const, message } : l))
            .slice(0, 50);
          persist(LOGS_KEY, logs);
          return { executionLogs: logs };
        });
        return false;
      }
    },

    addExecutionLog: (log) => {
      const newLog: ExecutionLog = {
        ...log,
        id: generateId(),
        executedAt: Date.now(),
      };
      set((draft) => {
        const logs = [newLog, ...draft.executionLogs].slice(0, 50);
        persist(LOGS_KEY, logs);
        return { executionLogs: logs };
      });
    },

    // 从后端同步规则与日志（合并后端定时触发的日志）
    syncFromBackend: async () => {
      try {
        const [rulesRes, logsRes] = await Promise.all([
          fetch(`${API_BASE}/automation/rules`).then((r) => r.json()),
          fetch(`${API_BASE}/automation/logs`).then((r) => r.json()),
        ]);
        const backendRules = rulesRes?.data;
        const backendLogs = logsRes?.data;

        if (Array.isArray(backendRules) && backendRules.length > 0) {
          // 后端为真相源，前端本地未编辑过的规则同步为后端版本
          set({ rules: backendRules });
          persist(RULES_KEY, backendRules);
        }
        if (Array.isArray(backendLogs) && backendLogs.length > 0) {
          // 合并后端日志（含定时触发），按时间倒序
          const merged = [...backendLogs, ...get().executionLogs]
            .filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i)
            .sort((a, b) => b.executedAt - a.executedAt)
            .slice(0, 50);
          set({ executionLogs: merged });
          persist(LOGS_KEY, merged);
        }
      } catch {
        // 后端不可用时保持本地
      }
    },

    // 派生数据
    getVisibleRules: () => {
      const { rules, showDisabled } = get();
      if (showDisabled) return rules;
      return rules.filter((r) => r.isEnabled);
    },
  };
});

export type { AutomationAction, TriggerConfig, ActionType };
