/**
 * 技能自动触发服务
 * 参考 EvoFlow 技能渐进式加载：
 *   Skill.autoTriggers（keyword / intent / regex）在对话前匹配用户输入，
 *   命中则把 promptTemplate 注入 systemPrompt，实现"情境自动触发"。
 */

import type { Skill } from '../types';

export interface TriggerMatch {
  skill: Skill;
  /** 用于模板替换的变量值 */
  variables: Record<string, string>;
}

/**
 * 匹配用户输入与技能的 autoTriggers
 * - keyword：输入包含关键词
 * - regex：输入匹配正则
 * - intent：输入包含意图动词（启发式）
 */
export function matchAutoTriggers(
  input: string,
  skills: Skill[]
): TriggerMatch[] {
  if (!input || input.trim().length < 2) return [];
  const text = input.trim();
  const matches: TriggerMatch[] = [];

  for (const skill of skills) {
    if (!skill.isEnabled) continue;
    const triggers = skill.autoTriggers || [];
    if (triggers.length === 0) continue;

    for (const trigger of triggers) {
      if (!trigger?.condition) continue;
      let hit = false;

      switch (trigger.type) {
        case 'keyword': {
          hit = text.includes(trigger.condition);
          break;
        }
        case 'regex': {
          try {
            hit = new RegExp(trigger.condition, 'i').test(text);
          } catch {
            hit = false;
          }
          break;
        }
        case 'intent': {
          // 意图启发式：输入含技能名或触发命令
          const intentWords = [skill.name, skill.triggerCommand.replace(/^\//, '')];
          hit = intentWords.some((w) => w && text.includes(w));
          break;
        }
        default:
          hit = false;
      }

      if (hit) {
        matches.push({
          skill,
          variables: buildVariables(skill, text),
        });
        break; // 每个技能只匹配一次
      }
    }
  }

  // 最多同时触发 3 个技能
  return matches.slice(0, 3);
}

/**
 * 从输入中提取模板变量
 * 规则：提取 {{var}} 对应的值（简单启发式：整句文本作为主要变量）
 */
function buildVariables(skill: Skill, input: string): Record<string, string> {
  const vars: Record<string, string> = { userMessage: input };
  // 提取模板中出现的变量名
  const templateVars = skill.promptTemplate.match(/\{\{(\w+)\}\}/g) || [];
  const varNames = [...new Set(templateVars.map((v) => v.slice(2, -2)))];
  for (const name of varNames) {
    if (!vars[name]) {
      vars[name] = input;
    }
  }
  return vars;
}

/**
 * 用变量渲染技能 promptTemplate
 */
export function renderSkillPrompt(skill: Skill, variables: Record<string, string>): string {
  return skill.promptTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
}

/**
 * 构造自动触发技能的 systemPrompt 注入文本
 */
export function buildAutoTriggerPrompt(matches: TriggerMatch[]): string {
  if (matches.length === 0) return '';
  const parts = matches.map((m, i) => {
    const rendered = renderSkillPrompt(m.skill, m.variables);
    return `【自动触发的技能 ${i + 1}：${m.skill.name}】\n${rendered}`;
  });
  return `以下技能因你的请求被自动触发，请按技能要求执行：\n\n${parts.join('\n\n')}`;
}
