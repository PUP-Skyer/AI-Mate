/**
 * 澄清机制服务
 * 参考 EvoFlow ClarificationMiddleware（CLARIFY→PLAN→ACT）：
 *   当用户请求信息缺失/需求含糊/方案选择/风险确认时，
 *   模型先输出带 <clarify> 标记的结构化澄清请求，
 *   前端拦截渲染提问卡片，用户回答后携带上下文续跑。
 */

export type ClarifyType = 'missing_info' | 'ambiguous' | 'approach_choice' | 'risk_confirmation' | 'suggestion';

export interface ClarifyRequest {
  type: ClarifyType;
  questions: string[];
  /** 模型建议的方向（供用户快速选择） */
  suggestions?: string[];
}

// 澄清系统提示词片段（拼接到 systemPrompt）
export const CLARIFY_SYSTEM_PROMPT = `
【澄清机制】
当出现以下情况时，你必须先输出澄清请求，不要直接执行：
1. 关键信息缺失（如做 BP 但没说是哪个项目）
2. 需求含糊（多个理解方式）
3. 方案选择（多路线需要用户定夺）
4. 风险确认（执行会产生重要影响）

澄清请求格式（严格包裹在 <clarify> 标签内，每行一个 JSON 对象，最后以 </clarify> 结束）：
<clarify>
{"type":"missing_info","questions":["问题1","问题2"],"suggestions":["建议方向1","建议方向2"]}
</clarify>

注意：
- <clarify> 标签之外可以简短说明为什么需要澄清
- 一次最多问 3 个问题
- 如果信息足够，正常执行，不要输出 clarify 标签`;

/** 解析模型输出中的澄清请求 */
export function parseClarifyRequest(content: string): ClarifyRequest | null {
  if (!content) return null;
  const match = content.match(/<clarify>([\s\S]*?)<\/clarify>/);
  if (!match) return null;

  const inner = match[1].trim();
  // 尝试整体 JSON 或逐行 JSON
  try {
    const parsed = JSON.parse(inner);
    if (parsed && Array.isArray(parsed.questions)) {
      return {
        type: normalizeType(parsed.type),
        questions: parsed.questions.map(String),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : undefined,
      };
    }
  } catch { /* 继续逐行解析 */ }

  // 逐行解析：可能有多行 JSON
  const lines = inner.split('\n');
  const questions: string[] = [];
  const suggestions: string[] = [];
  let type: ClarifyType = 'missing_info';
  for (const line of lines) {
    try {
      const obj = JSON.parse(line.trim());
      if (Array.isArray(obj.questions)) {
        questions.push(...obj.questions.map(String));
        if (obj.type) type = normalizeType(obj.type);
        if (Array.isArray(obj.suggestions)) suggestions.push(...obj.suggestions.map(String));
      }
    } catch { /* 忽略非 JSON 行 */ }
  }
  if (questions.length > 0) {
    return { type, questions, suggestions: suggestions.length > 0 ? suggestions : undefined };
  }
  return null;
}

function normalizeType(t: string): ClarifyType {
  if (t === 'ambiguous' || t === 'ambiguous_requirement') return 'ambiguous';
  if (t === 'approach_choice') return 'approach_choice';
  if (t === 'risk_confirmation') return 'risk_confirmation';
  if (t === 'suggestion') return 'suggestion';
  return 'missing_info';
}

/** 去除模型输出中的 clarify 标签（渲染时过滤） */
export function stripClarifyTags(content: string): string {
  if (!content) return content;
  return content
    .replace(/<clarify>[\s\S]*?<\/clarify>/g, '')
    .trim();
}

/** 澄清类型中文标签 */
export const CLARIFY_LABELS: Record<ClarifyType, string> = {
  missing_info: '信息缺失',
  ambiguous: '需求不明确',
  approach_choice: '方案选择',
  risk_confirmation: '风险确认',
  suggestion: '建议确认',
};
