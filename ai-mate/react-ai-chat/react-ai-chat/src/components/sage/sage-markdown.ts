/**
 * 军师AI Markdown 解析工具
 * 将 AI 返回的结构化 Markdown 拆分为分区数据
 */

/** 按二级标题（##）切分段落 */
export interface MarkdownSection {
  title: string;
  content: string;
}

export function splitByH2(markdown: string): MarkdownSection[] {
  const lines = markdown.split('\n');
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;

  for (const line of lines) {
    const h2 = line.match(/^#{2,3}\s+(.+)$/);
    if (h2) {
      if (current) sections.push(current);
      current = { title: h2[1].trim(), content: '' };
      continue;
    }
    if (current) {
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);

  // 无二级标题时整体作为一段
  if (sections.length === 0 && markdown.trim()) {
    sections.push({ title: '全文', content: markdown.trim() });
  }
  return sections;
}

/** 提取段落中的列表项 */
export function extractListItems(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*[-*]\s+(.+)$/);
    if (m) items.push(m[1].trim());
  }
  return items;
}

/** 提取段落中的键值对行（如：- 融资金额：500万） */
export function extractKeyValues(content: string): { label: string; value: string }[] {
  const pairs: { label: string; value: string }[] = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*[-*]?\s*([^：:]{2,12})[：:]\s*(.+)$/);
    if (m) pairs.push({ label: m[1].trim(), value: m[2].trim() });
  }
  return pairs;
}

/** 清理 markdown 标题符号 */
export function cleanMarkdown(text: string): string {
  return text.replace(/^#{1,6}\s*/gm, '').trim();
}
