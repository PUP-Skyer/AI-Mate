/**
 * 计划模式状态管理 (Zustand)
 * 参考 EvoFlow Supervisor Plan 模式：
 *   Supervisor 澄清意图 → plan() 生成可审阅计划 → 用户授权 → 按 depends_on 派发子任务
 * 支持多角色 DAG 执行（探路者/军师/工匠/管家）。
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { WritableDraft } from 'immer';
import type { AIRole } from './aiStore';

export type PlanStepStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed';
export type PlanStatus = 'draft' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  /** 执行角色：scout/sage/maker/butler */
  assignedRole: AIRole;
  /** 依赖的上游步骤 id 列表 */
  dependsOn: string[];
  /** 验收标准 */
  acceptance?: string;
  status: PlanStepStatus;
  result?: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
  status: PlanStatus;
  createdAt: number;
  updatedAt: number;
}

interface PlanStore {
  plans: Plan[];
  activePlanId: string | null;
  activeRole: AIRole;

  createPlan: (goal: string, steps: Omit<PlanStep, 'status'>[], role: AIRole) => string;
  approvePlan: (planId: string) => void;
  cancelPlan: (planId: string) => void;
  /** 将状态为 completed 的步骤依赖的待执行步骤推进为 ready */
  setStepStatus: (planId: string, stepId: string, status: PlanStepStatus, extra?: Partial<PlanStep>) => void;
  /** 计算当前可执行步骤（依赖全部 completed 且自身非终态） */
  getRunnableSteps: (planId: string) => PlanStep[];
  isPlanComplete: (planId: string) => boolean;
  deletePlan: (planId: string) => void;
  setActiveRole: (role: AIRole) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ROLE_ORDER: Record<AIRole, number> = { scout: 1, sage: 2, maker: 3, butler: 4 };

// 依赖排序：按 depends_on 拓扑排序（简单 Kahn 算法），同层按角色顺序
const topoSort = (steps: PlanStep[]): PlanStep[] => {
  const ids = new Set(steps.map((s) => s.id));
  const result: PlanStep[] = [];
  const visited = new Set<string>();
  const visit = (step: PlanStep) => {
    if (visited.has(step.id)) return;
    visited.add(step.id);
    for (const dep of step.dependsOn) {
      const d = steps.find((s) => s.id === dep);
      if (d && !visited.has(dep)) visit(d);
    }
    result.push(step);
  };
  // 先按角色顺序访问，保证同层顺序稳定
  [...steps]
    .sort((a, b) => (ROLE_ORDER[a.assignedRole] || 99) - (ROLE_ORDER[b.assignedRole] || 99))
    .forEach(visit);
  return result;
};

export const usePlanStore = create<PlanStore>()(
  immer<PlanStore>((set, get) => ({
    plans: [],
    activePlanId: null,
    activeRole: 'scout',

    createPlan: (goal, steps, role) => {
      const id = generateId();
      const plan: Plan = {
        id,
        goal,
        steps: steps.map((s) => ({ ...s, status: 'pending' })),
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((draft: WritableDraft<PlanStore>) => {
        draft.plans.unshift(plan);
        draft.activePlanId = id;
        draft.activeRole = role;
      });
      return id;
    },

    approvePlan: (planId) => {
      set((draft: WritableDraft<PlanStore>) => {
        const plan = draft.plans.find((p) => p.id === planId);
        if (!plan || plan.status !== 'draft') return;
        plan.status = 'approved';
        plan.updatedAt = Date.now();
        // 无依赖的步骤置为 ready
        plan.steps.forEach((s) => {
          if (s.dependsOn.length === 0 && s.status === 'pending') s.status = 'ready';
        });
      });
    },

    cancelPlan: (planId) => {
      set((draft: WritableDraft<PlanStore>) => {
        const plan = draft.plans.find((p) => p.id === planId);
        if (!plan) return;
        plan.status = 'cancelled';
        plan.steps.forEach((s) => {
          if (s.status === 'pending' || s.status === 'ready' || s.status === 'running') {
            s.status = 'pending';
          }
        });
        plan.updatedAt = Date.now();
      });
    },

    setStepStatus: (planId, stepId, status, extra) => {
      set((draft: WritableDraft<PlanStore>) => {
        const plan = draft.plans.find((p) => p.id === planId);
        if (!plan) return;
        const step = plan.steps.find((s) => s.id === stepId);
        if (!step) return;
        step.status = status;
        if (extra) Object.assign(step, extra);
        if (status === 'running') step.startedAt = Date.now();
        if (status === 'completed' || status === 'failed') step.finishedAt = Date.now();
        plan.updatedAt = Date.now();

        // 步骤完成后推进依赖它的下游步骤
        if (status === 'completed') {
          for (const s of plan.steps) {
            if (s.status === 'pending' && s.dependsOn.length > 0) {
              const allDone = s.dependsOn.every(
                (dep) => plan.steps.find((d) => d.id === dep)?.status === 'completed'
              );
              if (allDone) s.status = 'ready';
            }
          }
          // 全部完成则计划完成
          if (plan.steps.every((s) => s.status === 'completed')) {
            plan.status = 'completed';
          }
        }
        if (status === 'failed') {
          plan.status = 'failed';
        }
      });
    },

    getRunnableSteps: (planId) => {
      const plan = get().plans.find((p) => p.id === planId);
      if (!plan) return [];
      const runnable = plan.steps.filter((s) => s.status === 'ready' || s.status === 'running');
      return topoSort(runnable);
    },

    isPlanComplete: (planId) => {
      const plan = get().plans.find((p) => p.id === planId);
      return !!plan && plan.steps.length > 0 && plan.steps.every((s) => s.status === 'completed');
    },

    deletePlan: (planId) => {
      set((draft: WritableDraft<PlanStore>) => {
        draft.plans = draft.plans.filter((p) => p.id !== planId);
        if (draft.activePlanId === planId) draft.activePlanId = null;
      });
    },

    setActiveRole: (role) => set({ activeRole: role }),
  }))
);
