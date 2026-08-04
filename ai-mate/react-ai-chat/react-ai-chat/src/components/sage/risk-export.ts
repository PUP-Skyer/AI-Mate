/**
 * 风险矩阵导出模块
 * PDF（window.print）/ Word（HTML Blob）/ Markdown
 */
import type { RiskMatrixData } from './risk-utils';
import { RISK_LEVEL_STYLES, RISK_QUADRANTS } from './risk-utils';

/** 触发文件下载 */
function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Word 文档内联 CSS */
const WORD_CSS = `
  body { font-family: 'Noto Serif SC', serif; color: #292524; line-height: 1.8; }
  h1 { color: #9F1239; font-size: 22pt; text-align: center; margin-bottom: 4pt; }
  h2 { color: #9F1239; font-size: 14pt; border-bottom: 1px solid #E11D48; padding-bottom: 4pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  td, th { border: 1px solid #ccc; padding: 6pt 8pt; font-size: 10.5pt; }
  th { background: #FBE9EC; color: #9F1239; }
  .risk-level { font-weight: bold; padding: 2pt 6pt; border-radius: 3pt; color: #fff; }
  .meta { color: #666; font-size: 10pt; text-align: center; margin-bottom: 12pt; }
`;

/** 构建报告 HTML（供 Word 导出与 PDF 打印共用） */
export function buildRiskReportHTML(data: RiskMatrixData): string {
  const grouped = RISK_QUADRANTS.map(q => ({
    ...q,
    items: data.risks.filter(r => r.level === q.key),
  }));

  const quadrantTable = `
    <table>
      <tr>
        <th>象限</th><th>概率×影响</th><th>风险数</th><th>风险名称</th>
      </tr>
      ${grouped.map(g => `
        <tr>
          <td><span class="risk-level" style="background:${RISK_LEVEL_STYLES[g.key].color}">${g.label}</span></td>
          <td>${g.subtitle}</td>
          <td>${g.items.length}</td>
          <td>${g.items.map(i => i.name).join('、') || '—'}</td>
        </tr>
      `).join('')}
    </table>`;

  const detailSections = grouped.map(g => `
    <h2>${g.label}（${g.subtitle}）</h2>
    ${g.items.length === 0 ? '<p>暂无风险项</p>' : g.items.map(item => `
      <p><strong>${item.name}</strong>：${item.description}</p>
      <p style="margin-left:20pt">应对策略：${item.strategy}</p>
    `).join('')}`).join('');

  const summarySection = data.summary
    ? `<h2>风险应对总结</h2><p style="white-space:pre-wrap">${data.summary}</p>`
    : '';

  return `
    <h1>风险矩阵分析报告</h1>
    <p class="meta">项目名称：${data.projectName} | 生成时间：${new Date(data.updatedAt).toLocaleString()}</p>
    <h2>风险象限汇总</h2>
    ${quadrantTable}
    ${detailSections}
    ${summarySection}
  `;
}

/** 导出 Word 文档 */
export function exportRiskWord(data: RiskMatrixData): void {
  const html = buildRiskReportHTML(data);
  const fullDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><style>${WORD_CSS}</style></head>
    <body>${html}</body></html>`;
  downloadFile(fullDoc, `${data.projectName}-风险矩阵报告.doc`, 'application/msword');
}

/** 导出 PDF（通过浏览器打印对话框另存为PDF） */
export function exportRiskPDF(): void {
  document.body.classList.add('sage-risk-printing');
  window.print();
  setTimeout(() => document.body.classList.remove('sage-risk-printing'), 500);
}

/** 导出 Markdown（兜底） */
export function exportRiskMarkdown(data: RiskMatrixData): void {
  downloadFile(data.rawMarkdown, `${data.projectName}-风险矩阵报告.md`, 'text/markdown');
}
