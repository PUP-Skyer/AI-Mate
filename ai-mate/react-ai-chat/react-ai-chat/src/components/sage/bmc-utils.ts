/**
 * 商业模式画布工具：维度常量 / 树类型 / 解析器 / 画像 / prompt / 序列化
 */
import type { RequirementsReport } from './sage-storage';

// 商业模式画布9大维度
export const BMC_DIMENSIONS = [
  { key: 'customerSegments', label: '客户细分', color: '#1677ff', icon: '👥' },
  { key: 'valuePropositions', label: '价值主张', color: '#52c41a', icon: '💎' },
  { key: 'channels', label: '渠道通路', color: '#faad14', icon: '📢' },
  { key: 'customerRelationships', label: '客户关系', color: '#eb2f96', icon: '🤝' },
  { key: 'revenueStreams', label: '收入来源', color: '#722ed1', icon: '💰' },
  { key: 'keyResources', label: '核心资源', color: '#13c2c2', icon: '🛠️' },
  { key: 'keyActivities', label: '关键业务', color: '#fa541c', icon: '⚡' },
  { key: 'keyPartnerships', label: '重要合作', color: '#2f54eb', icon: '🤲' },
  { key: 'costStructure', label: '成本结构', color: '#f5222d', icon: '📊' },
];

/** 3×3 九宫格排布顺序（左列供给端 / 中列价值端 / 右列需求端） */
export const BMC_GRID_ORDER: string[] = [
  'keyPartnerships', 'keyActivities', 'customerRelationships',
  'keyResources',      'valuePropositions', 'channels',
  'costStructure',     'revenueStreams',    'customerSegments',
];

// 幕布式树节点
export interface TreeNode {
  id: string;
  text: string;
  children: TreeNode[];
  expanded: boolean;
  editing?: boolean;
}

export interface BMCData {
  projectName: string;
  dimensions: Record<string, TreeNode>;
}

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

// 默认空树结构
export const createEmptyTree = (dimensionKey: string, dimensionLabel: string): TreeNode => ({
  id: `${dimensionKey}-root`,
  text: dimensionLabel,
  children: [],
  expanded: true,
});

// 解析AI生成的Markdown为树结构
export const parseMarkdownToTree = (markdown: string): Record<string, TreeNode> => {
  const dimensions: Record<string, TreeNode> = {};

  BMC_DIMENSIONS.forEach((dim) => {
    dimensions[dim.key] = createEmptyTree(dim.key, dim.label);
  });

  const lines = markdown.split('\n');
  let currentDim: string | null = null;
  const dimStack: TreeNode[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 匹配 ## 1. 客户细分（Customer Segments）
    const dimMatch = trimmed.match(/^##\s*\d+\.\s*([^（]+)/);
    if (dimMatch) {
      const dimLabel = dimMatch[1].trim();
      const dim = BMC_DIMENSIONS.find((d) => d.label === dimLabel || dimLabel.includes(d.label));
      if (dim) {
        currentDim = dim.key;
        dimStack.length = 0;
        dimStack.push(dimensions[currentDim]);
      }
      return;
    }

    // 匹配 - 或 * 开头的列表项
    const listMatch = trimmed.match(/^(\s*)[-*]\s+(.+)$/);
    if (listMatch && currentDim) {
      const indent = listMatch[1].length;
      const text = listMatch[2].trim();
      const level = Math.floor(indent / 2) + 1;

      const newNode: TreeNode = {
        id: generateId(),
        text,
        children: [],
        expanded: true,
      };

      // 根据缩进确定父节点
      while (dimStack.length > level) {
        dimStack.pop();
      }

      const parent = dimStack[dimStack.length - 1];
      if (parent) {
        parent.children.push(newNode);
        dimStack.push(newNode);
      }
    }
  });

  return dimensions;
};

/** 用户画像字段定义（标签式输入） */
export type PersonaField = 'age' | 'scene' | 'budget' | 'hangout' | 'custom';
export type PersonaData = Record<PersonaField, string[]>;

export const PERSONA_FIELDS: {
  key: PersonaField; label: string; placeholder: string; suggestions?: string[];
}[] = [
  { key: 'age',     label: '年龄',   placeholder: '如 18-25，回车添加', suggestions: ['18-25', '26-35', '36-45'] },
  { key: 'scene',   label: '场景',   placeholder: '如 通勤路上，回车添加', suggestions: ['通勤路上', '宿舍学习', '办公室'] },
  { key: 'budget',  label: '预算',   placeholder: '如 月均 200 元', suggestions: ['0-100元', '100-500元', '500元以上'] },
  { key: 'hangout', label: '聚集地', placeholder: '如 B站、小红书', suggestions: ['小红书', 'B站', '抖音'] },
  { key: 'custom',  label: '自定义', placeholder: '自定义标签，回车添加' },
];

export const EMPTY_PERSONA: PersonaData = { age: [], scene: [], budget: [], hangout: [], custom: [] };

/** 生成画布的 system prompt：9 维度 + 强制末尾商业模式说明 */
export const BMC_SYSTEM_PROMPT = `你是一位商业模式设计专家。请基于用户提供的【需求分析报告】与【用户画像】，生成一份完整的商业模式画布分析报告（Markdown 格式）。

输出结构（必须严格包含 9 个维度，每个维度用 ## 标题开头，最后输出商业模式说明）：
# 商业模式画布 — {项目名称}

## 1. 客户细分（Customer Segments）
- 一级要点
  - 二级展开（可选）

## 2. 价值主张（Value Propositions）
- 一级要点

## 3. 渠道通路（Channels）
- 一级要点

## 4. 客户关系（Customer Relationships）
- 一级要点

## 5. 收入来源（Revenue Streams）
- 一级要点

## 6. 核心资源（Key Resources）
- 一级要点

## 7. 关键业务（Key Activities）
- 一级要点

## 8. 重要合作（Key Partnerships）
- 一级要点

## 9. 成本结构（Cost Structure）
- 一级要点

## 10. 商业模式说明
- 一句话定位：……
- 核心差异化：……
- 主要风险：……
- 增长策略：……
（商业模式说明固定输出 4-6 条一句话短句，每条不超过 30 字，便于标签展示）

每个维度至少提供 2-3 个一级要点，重要维度可展开二级子项。`;

/** 组装用户内容：需求分析报告 + 用户画像 */
export function buildBMCUserContent(report: RequirementsReport, persona: PersonaData): string {
  const personaLines = [
    `年龄：${persona.age.join('、') || '未设定'}`,
    `场景：${persona.scene.join('、') || '未设定'}`,
    `预算：${persona.budget.join('、') || '未设定'}`,
    `聚集地：${persona.hangout.join('、') || '未设定'}`,
    `自定义：${persona.custom.join('、') || '未设定'}`,
  ];
  return [`【需求分析报告】\n${report.result}`, `【用户画像锁定】\n${personaLines.join('\n')}`].join('\n\n');
}

/** 从「商业模式说明」章节提取标签式要点 */
export function parseSummaryTags(markdown: string): string[] {
  const tags: string[] = [];
  let inSummary = false;
  for (const line of markdown.split('\n')) {
    const t = line.trim();
    if (/^##\s*\d*\.?\s*商业模式说明/.test(t)) { inSummary = true; continue; }
    if (inSummary && /^##\s/.test(t)) break;
    const m = t.match(/^\s*[-*]\s+(.+)$/);
    if (inSummary && m) tags.push(m[1].trim());
  }
  return tags.slice(0, 8);
}

/** 将（可能被编辑过的）维度树序列化回 Markdown，供导出 */
export function treeToMarkdown(dimensions: Record<string, TreeNode>, projectName: string): string {
  const lines: string[] = [`# 商业模式画布 — ${projectName}`, ''];
  BMC_DIMENSIONS.forEach((dim, i) => {
    lines.push(`## ${i + 1}. ${dim.label}`, '');
    const walk = (node: TreeNode, depth: number) => {
      node.children.forEach((child) => {
        lines.push(`${'  '.repeat(depth)}- ${child.text}`);
        walk(child, depth + 1);
      });
    };
    walk(dimensions[dim.key], 0);
    lines.push('');
  });
  return lines.join('\n');
}
