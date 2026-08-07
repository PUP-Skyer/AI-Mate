/**
 * 融资规划工具：类型定义 / 系统提示词 / 用户内容组装 / Markdown解析器
 * 案四 · 财青
 */
import type { RequirementsReport } from './sage-storage';
import type { BMCData } from './bmc-utils';
import type { RiskMatrixData } from './risk-utils';
import { treeToMarkdown, generateId } from './bmc-utils';
import { splitByH2, extractListItems } from './sage-markdown';

/** 融资方类型 */
export type ProviderType = 'institution' | 'individual';

/** 融资阶段（每年可含多轮） */
export interface FinancingStage {
  id: string;
  year: number;           // 第几年（1, 2, 3...）
  roundName: string;      // 轮次名称：种子轮、天使轮、Pre-A轮
  targetAmount: number;   // 目标融资金额（万元）
  equityOffered: number;  // 出让股权比例 %
  valuation: number;      // 预期估值（万元）
  timeline: string;       // 时间段：如 "2026年Q1-Q2"
  milestones: string[];   // 该阶段融资计划（无序列表项）
}

/** 融资方信息 */
export interface FinancingProvider {
  id: string;
  name: string;           // 机构/个人名称
  type: ProviderType;     // 机构 or 个人
  category: string;       // 类型：VC、天使投资人、产业资本
  focusArea: string;      // 关注领域
  typicalTicket: string;  // 典型投资额度
  description: string;    // 简介
  matchReason: string;    // 匹配理由
  contactStrategy: string;// 接触建议
}

/** 基础体系四模块 */
export interface FinancingBaseSystem {
  pricing: string[];        // 定价体系
  serviceProcess: string[]; // 服务流程
  afterSales: string[];     // 售后标准
  accountingRules: string[];// 财务记账规则
}

/** 融资规划完整数据 */
export interface FinancingData {
  projectName: string;
  baseSystem: FinancingBaseSystem;
  stages: FinancingStage[];
  providers: FinancingProvider[];
  summary: string;         // 融资策略总结
  rawMarkdown: string;     // AI原始返回（供导出兜底）
  updatedAt: number;
}

/** 融资方详情（API扩展字段，供 financingService 使用） */
export interface ProviderDetail extends FinancingProvider {
  portfolio?: string[];        // 投资组合/代表项目
  contactInfo?: string;        // 联系方式（邮箱/电话/官网）
  successCases?: string[];     // 成功投资案例
  investmentRange?: string;    // 投资额度范围
  geographicFocus?: string;    // 地域偏好
  stagePreference?: string;    // 阶段偏好（种子/天使/A轮...）
}

/** 系统提示词 */
export const FINANCE_SYSTEM_PROMPT = `你是一位资深融资顾问，擅长为大学生创业团队设计全生命周期融资规划。请基于用户提供的【需求分析报告】、【商业模式画布】与【风险矩阵】，生成一份结构化融资规划报告（Markdown 格式）。

输出结构（严格使用 ## 二级标题，共六个章节）：

# 融资规划方案 — {项目名称}

## 一、基础体系搭建

### 定价体系
- 产品/服务定价策略说明（每条以 - 开头）

### 服务流程
- 标准化服务流程节点（每条以 - 开头）

### 售后标准
- 售后服务标准与承诺（每条以 - 开头）

### 财务记账规则
- 财务记账规范与科目设置（每条以 - 开头）

## 二、年度融资规划

### 第1年融资
- 轮次：种子轮
- 金额：XX万元
- 出让股权：XX%
- 估值：XX万元
- 时间：20XX年Q1-Q2
- 里程碑：
  - 里程碑1
  - 里程碑2

### 第2年融资
（同上格式，天使轮或Pre-A轮）

### 第3年融资
（同上格式，A轮或B轮）

## 三、融资方推荐 — 机构投资方

### 1. 机构名称
- 类型：VC / 产业资本 / 政府引导基金
- 关注领域：XX
- 典型投资额度：XX万元
- 简介：XX
- 匹配理由：XX
- 接触建议：XX

### 2. （第二个机构，同上格式）

## 四、融资方推荐 — 个人投资方

### 1. 投资人姓名
- 类型：天使投资人
- 关注领域：XX
- 典型投资额度：XX万元
- 简介：XX
- 匹配理由：XX
- 接触建议：XX

### 2. （第二个个人，同上格式）

## 五、融资策略总结
给出整体融资路线图、关键节点把控、风险防范与投资人沟通策略要点。

要求：
1. 基础体系四模块每模块至少3条具体内容
2. 年度融资至少规划3年，每年含轮次/金额/股权/估值/时间/里程碑
3. 机构投资方至少推荐3家，个人投资方至少推荐2位
4. 金额单位统一为万元，股权百分比保留一位小数
5. 结合需求报告中的行业、画布中的商业模式、风险矩阵中的风险项给出针对性建议`;

/** 组装用户内容：需求分析报告 + 商业模式画布 + 风险矩阵 */
export function buildFinanceUserContent(
  report: RequirementsReport,
  bmcData: BMCData | null,
  riskData: RiskMatrixData | null
): string {
  const parts: string[] = [];
  parts.push(`【需求分析报告】\n项目名称：${report.inputs.projectName || '未命名项目'}\n${report.result}`);

  if (bmcData) {
    const bmcText = treeToMarkdown(bmcData.dimensions, bmcData.projectName);
    parts.push(`【商业模式画布】\n${bmcText}`);
  }

  if (riskData && riskData.risks.length > 0) {
    const riskText = riskData.risks
      .map(r => `- [${r.level === 'high' ? '高' : r.level === 'midHigh' ? '中高' : r.level === 'mid' ? '中' : '低'}风险] ${r.name}：${r.description}（应对：${r.strategy}）`)
      .join('\n');
    parts.push(`【风险矩阵】\n${riskText}`);
  }

  return parts.join('\n\n');
}

/** 解析金额数字（万元），支持 "500万"、"500"、"500.0万" */
function parseAmount(text: string): number {
  const m = text.match(/([\d.]+)\s*万?/);
  return m ? parseFloat(m[1]) : 0;
}

/** 解析百分比 */
function parsePercent(text: string): number {
  const m = text.match(/([\d.]+)\s*%?/);
  return m ? parseFloat(m[1]) : 0;
}

/** 解析基础体系 */
function parseBaseSystem(sections: ReturnType<typeof splitByH2>): FinancingBaseSystem {
  const findSection = (keywords: string[]): string[] => {
    for (const s of sections) {
      if (keywords.some(kw => s.title.includes(kw))) {
        return extractListItems(s.content);
      }
    }
    return [];
  };

  return {
    pricing: findSection(['定价']),
    serviceProcess: findSection(['服务流程']),
    afterSales: findSection(['售后']),
    accountingRules: findSection(['记账', '财务规则']),
  };
}

/** 解析年度融资阶段 */
function parseStages(sections: ReturnType<typeof splitByH2>): FinancingStage[] {
  const stages: FinancingStage[] = [];

  for (const s of sections) {
    // 匹配 "第1年融资" / "第2年融资" / "年度融资规划" 下的子段
    const yearMatch = s.title.match(/第\s*(\d+)\s*年/);
    if (!yearMatch) continue;

    const year = parseInt(yearMatch[1], 10);
    const content = s.content;

    // 提取轮次
    const roundMatch = content.match(/轮次[：:]\s*(.+)/);
    const roundName = roundMatch ? roundMatch[1].trim() : `第${year}年融资`;

    // 提取金额
    const amountMatch = content.match(/金额[：:]\s*(.+)/);
    const targetAmount = amountMatch ? parseAmount(amountMatch[1]) : 0;

    // 提取股权
    const equityMatch = content.match(/出让股权[：:]\s*(.+)/);
    const equityOffered = equityMatch ? parsePercent(equityMatch[1]) : 0;

    // 提取估值
    const valuationMatch = content.match(/估值[：:]\s*(.+)/);
    const valuation = valuationMatch ? parseAmount(valuationMatch[1]) : 0;

    // 提取时间
    const timelineMatch = content.match(/时间[：:]\s*(.+)/);
    const timeline = timelineMatch ? timelineMatch[1].trim() : '';

    // 提取里程碑
    const milestoneMatch = content.match(/里程碑[：:]\s*\n?([\s\S]+)$/);
    let milestones: string[] = [];
    if (milestoneMatch) {
      milestones = extractListItems(milestoneMatch[1]);
    }
    if (milestones.length === 0) {
      milestones = extractListItems(content).filter(item =>
        !item.startsWith('轮次') && !item.startsWith('金额') &&
        !item.startsWith('出让') && !item.startsWith('估值') &&
        !item.startsWith('时间')
      );
    }

    stages.push({
      id: generateId(),
      year,
      roundName,
      targetAmount,
      equityOffered,
      valuation,
      timeline,
      milestones,
    });
  }

  return stages;
}

/** 解析融资方推荐 */
function parseProviders(
  sections: ReturnType<typeof splitByH2>,
  type: ProviderType
): FinancingProvider[] {
  const providers: FinancingProvider[] = [];
  const keyword = type === 'institution' ? '机构' : '个人';

  for (const s of sections) {
    if (!s.title.includes(keyword)) continue;

    // 将内容按 "###" 或数字序号分块
    const blocks = s.content.split(/(?=^\s*###?\s*\d+\.)/m).filter(b => b.trim());
    for (const block of blocks) {
      const nameMatch = block.match(/^#{2,3}\s*\d+\.\s*(.+)/m);
      if (!nameMatch) continue;

      const name = nameMatch[1].trim();
      const getType = (label: string, fallback: string): string => {
        const m = block.match(new RegExp(`${label}[：:]\\s*(.+)`));
        return m ? m[1].trim() : fallback;
      };

      providers.push({
        id: generateId(),
        name,
        type,
        category: getType('类型', type === 'institution' ? 'VC' : '天使投资人'),
        focusArea: getType('关注领域', ''),
        typicalTicket: getType('典型投资额度', ''),
        description: getType('简介', ''),
        matchReason: getType('匹配理由', ''),
        contactStrategy: getType('接触建议', ''),
      });
    }
  }

  return providers;
}

/** 解析AI返回的Markdown为结构化融资数据 */
export function parseFinanceMarkdown(markdown: string, projectName: string): FinancingData {
  const sections = splitByH2(markdown);

  const baseSystem = parseBaseSystem(sections);
  const stages = parseStages(sections);
  const institutions = parseProviders(sections, 'institution');
  const individuals = parseProviders(sections, 'individual');

  // 提取总结
  let summary = '';
  const summarySection = sections.find(s => s.title.includes('总结') || s.title.includes('策略'));
  if (summarySection) {
    summary = summarySection.content.trim();
  }

  return {
    projectName,
    baseSystem,
    stages,
    providers: [...institutions, ...individuals],
    summary,
    rawMarkdown: markdown,
    updatedAt: Date.now(),
  };
}
