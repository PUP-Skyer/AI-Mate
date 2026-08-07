/**
 * 管家AI Markdown 解析工具
 * 将 AI 返回的结构化 Markdown 拆分为分区数据 + 简单 HTML 渲染
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

/** 提取段落中的键值对行 */
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

/**
 * 将 Markdown 渲染为 HTML（正则替换，不引入 react-markdown）
 * 支持：h1/h2/h3、加粗、斜体、行内代码、有序/无序列表、表格、段落
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/^\|(.+)\|$/gm, (m) =>
      '<tr>' + m.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
    )
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table border="1" style="border-collapse:collapse;width:100%">$1</table>')
    .replace(/\n{2,}/g, '<br/><br/>');
  return html;
}
