/**
 * 军师AI 面板间数据共享（localStorage）
 * 需求分析报告由 AIGeneratorForm 落盘，商业模式画布面板读取
 */

import type { BMCData } from './bmc-utils';
import type { RiskMatrixData } from './risk-utils';
import type { FinancingData } from './finance-utils';

export interface RequirementsReport {
  /** 需求分析表单输入（projectName / ideaContent / targetUser / stage） */
  inputs: Record<string, string>;
  /** AI 生成的 Markdown 报告全文 */
  result: string;
  /** 生成时间戳 */
  updatedAt: number;
}

export const SAGE_REQUIREMENTS_KEY = 'ai-mate-sage-requirements-report';
export const SAGE_BMC_KEY = 'ai-mate-sage-bmc';

/** 读取需求分析报告；不存在或损坏返回 null */
export function loadRequirementsReport(): RequirementsReport | null {
  try {
    const raw = localStorage.getItem(SAGE_REQUIREMENTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RequirementsReport>;
    if (!parsed || typeof parsed.result !== 'string' || typeof parsed.inputs !== 'object') return null;
    return parsed as RequirementsReport;
  } catch {
    return null;
  }
}

/** 保存需求分析报告（由 AIGeneratorForm 生成成功后调用） */
export function saveRequirementsReport(
  inputs: Record<string, unknown>,
  result: string
): void {
  try {
    localStorage.setItem(
      SAGE_REQUIREMENTS_KEY,
      JSON.stringify({ inputs, result, updatedAt: Date.now() })
    );
  } catch {
    // localStorage 不可用时静默失败（与 aiStore 一致）
  }
}

/** 读取商业模式画布数据；不存在或损坏返回 null */
export function loadBMCData(): BMCData | null {
  try {
    const raw = localStorage.getItem(SAGE_BMC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BMCData;
    if (!parsed || typeof parsed.projectName !== 'string' || !parsed.dimensions) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 保存商业模式画布数据 */
export function saveBMCData(data: BMCData): void {
  try {
    localStorage.setItem(SAGE_BMC_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export const SAGE_RISK_KEY = 'ai-mate-sage-risk-matrix';

/** 读取风险矩阵数据；不存在或损坏返回 null */
export function loadRiskData(): RiskMatrixData | null {
  try {
    const raw = localStorage.getItem(SAGE_RISK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RiskMatrixData;
    if (!parsed || typeof parsed.projectName !== 'string' || !Array.isArray(parsed.risks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 保存风险矩阵数据 */
export function saveRiskData(data: RiskMatrixData): void {
  try {
    localStorage.setItem(SAGE_RISK_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export const SAGE_FINANCE_KEY = 'ai-mate-sage-financing-plan';

/** 读取融资规划数据；不存在或损坏返回 null */
export function loadFinanceData(): FinancingData | null {
  try {
    const raw = localStorage.getItem(SAGE_FINANCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinancingData;
    if (!parsed || typeof parsed.projectName !== 'string' || !Array.isArray(parsed.stages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 保存融资规划数据 */
export function saveFinanceData(data: FinancingData): void {
  try {
    localStorage.setItem(SAGE_FINANCE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用时静默失败
  }
}
