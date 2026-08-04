/**
 * 风险矩阵工具：类型定义 / 等级常量 / 系统提示词 / 用户内容组装 / Markdown解析器
 */
import type { RequirementsReport } from './sage-storage';
import type { BMCData } from './bmc-utils';
import { treeToMarkdown, generateId } from './bmc-utils';
import { splitByH2, extractListItems } from './sage-markdown';

/** 风险等级 — 对应2×2象限的四个区域 */
export type RiskLevel = 'high' | 'midHigh' | 'mid' | 'low';

/** 发生概率 / 影响程度（象限坐标轴） */
export type AxisValue = 'high' | 'low';

export interface RiskItem {
  id: string;
  name: string;           // 风险名称
  description: string;    // 风险描述
  level: RiskLevel;       // 等级
  probability: AxisValue; // 发生概率（X轴）
  impact: AxisValue;      // 影响程度（Y轴）
  strategy: string;       // 应对策略
}

export interface RiskMatrixData {
  projectName: string;
  risks: RiskItem[];
  summary: string;        // 风险应对总结全文
  rawMarkdown: string;    // AI原始返回（供导出兜底）
  updatedAt: number;
}

/** 等级样式映射 */
export const RISK_LEVEL_STYLES: Record<RiskLevel, {
  color: string; bg: string; label: string;
  probability: AxisValue; impact: AxisValue;
}> = {
  high:    { color: '#E11D48', bg: 'rgba(225,29,72,0.08)', label: '高风险',
             probability: 'high', impact: 'high' },
  midHigh: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: '中高风险',
             probability: 'low', impact: 'high' },
  mid:     { color: '#0E7490', bg: 'rgba(14,116,144,0.08)', label: '中风险',
             probability: 'high', impact: 'low' },
  low:     { color: '#059669', bg: 'rgba(5,150,105,0.08)', label: '低风险',
             probability: 'low', impact: 'low' },
};

/**
 * 2×2象限定义（渲染顺序：左上→右上→左下→右下）
 * 布局：
 *   ┌────────────┬────────────┐
 *   │ 中高风险(橙) │ 高风险(红)  │  ← 影响程度：大
 *   ├────────────┼────────────┤
 *   │ 低风险(绿)   │ 中风险(青)  │  ← 影响程度：小
 *   └────────────┴────────────┘
 *    发生概率：低     发生概率：高
 */
export const RISK_QUADRANTS = [
  { key: 'midHigh' as RiskLevel, label: '中高风险', subtitle: '低概率 · 高影响', pos: 'top-left' },
  { key: 'high' as RiskLevel,    label: '高风险',   subtitle: '高概率 · 高影响', pos: 'top-right' },
  { key: 'low' as RiskLevel,     label: '低风险',   subtitle: '低概率 · 低影响', pos: 'bottom-left' },
  { key: 'mid' as RiskLevel,     label: '中风险',   subtitle: '高概率 · 低影响', pos: 'bottom-right' },
];

/** 系统提示词 */
export const RISK_SYSTEM_PROMPT = `你是一位创业风险管理专家。请基于用户提供的【需求分析报告】与【商业模式画布】，对该项目进行前瞻性风险识别与评估，输出标准化的风险矩阵分析报告（Markdown 格式）。

输出结构（严格使用 ## 二级标题，共五个章节）：
# 风险矩阵分析报告 — {项目名称}

## 一、高风险项（发生概率高 × 影响程度大）
- **风险名称**：风险描述
  - 应对策略：具体措施

## 二、中高风险项（发生概率低 × 影响程度大）
- **风险名称**：风险描述
  - 应对策略：具体措施

## 三、中风险项（发生概率高 × 影响程度小）
- **风险名称**：风险描述
  - 应对策略：具体措施

## 四、低风险项（发生概率低 × 影响程度小）
- **风险名称**：风险描述
  - 应对策略：具体措施

## 五、风险应对总结
给出整体风险等级评定、关键风险监控指标、风险预警机制与应急预案要点。

要求：
1. 每个等级至少识别 2-3 项风险，结合需求报告与画布中的具体业务环节
2. 风险名称简洁（6-12字），描述需说明风险触发条件与潜在后果
3. 应对策略须可执行，包含"规避/转移/减轻/接受"的明确选择`;

/** 组装用户内容：需求分析报告 + 商业模式画布 */
export function buildRiskUserContent(
  report: RequirementsReport,
  bmcData: BMCData | null
): string {
  const parts: string[] = [];
  parts.push(`【需求分析报告】\n项目名称：${report.inputs.projectName || '未命名项目'}\n${report.result}`);

  if (bmcData) {
    const bmcText = treeToMarkdown(bmcData.dimensions, bmcData.projectName);
    parts.push(`【商业模式画布】\n${bmcText}`);
  }
  return parts.join('\n\n');
}

/** 识别风险等级 */
const detectLevel = (title: string): RiskLevel => {
  if (title.includes('高风险')) return 'high';
  if (title.includes('中高风险') || title.includes('中高')) return 'midHigh';
  if (title.includes('中风险')) return 'mid';
  if (title.includes('低风险')) return 'low';
  return 'mid';
};

/** 解析AI返回的Markdown为结构化风险数据 */
export function parseRiskMarkdown(markdown: string, projectName: string): RiskMatrixData {
  const sections = splitByH2(markdown);
  const risks: RiskItem[] = [];
  let summary = '';

  for (const section of sections) {
    if (section.title.includes('总结') || section.title.includes('应对')) {
      summary = section.content.trim();
      continue;
    }
    const level = detectLevel(section.title);
    const meta = RISK_LEVEL_STYLES[level];

    // 尝试匹配 "**名称**：描述" + "应对策略：xxx" 格式
    const blocks = section.content.split(/(?=^\s*-\s*\*\*)/m);
    for (const block of blocks) {
      const nameMatch = block.match(/\*\*(.+?)\*\*[：:]\s*(.+)/);
      if (!nameMatch) continue;
      const strategyMatch = block.match(/应对策略[：:]\s*(.+)/);
      risks.push({
        id: generateId(),
        name: nameMatch[1].trim(),
        description: nameMatch[2].trim(),
        level,
        probability: meta.probability,
        impact: meta.impact,
        strategy: strategyMatch ? strategyMatch[1].trim() : '待补充',
      });
    }

    // 兜底：若未匹配到加粗格式，用 extractListItems 提取
    if (risks.filter(r => r.level === level).length === 0) {
      for (const item of extractListItems(section.content)) {
        const idx = item.search(/[：:]/);
        risks.push({
          id: generateId(),
          name: idx > 0 ? item.slice(0, idx).trim() : item.slice(0, 20),
          description: idx > 0 ? item.slice(idx + 1).trim() : item,
          level,
          probability: meta.probability,
          impact: meta.impact,
          strategy: '待补充',
        });
      }
    }
  }

  return { projectName, risks, summary, rawMarkdown: markdown, updatedAt: Date.now() };
}
