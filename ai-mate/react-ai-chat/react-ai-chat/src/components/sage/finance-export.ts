/**
 * 融资规划导出模块
 * PDF（window.print）/ Word（HTML Blob）/ Markdown
 * 零第三方依赖
 */
import type { FinancingData } from './finance-utils';

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
  h1 { color: #115E59; font-size: 22pt; text-align: center; margin-bottom: 4pt; }
  h2 { color: #115E59; font-size: 14pt; border-bottom: 1px solid #0D9488; padding-bottom: 4pt; }
  h3 { color: #0F766E; font-size: 12pt; margin-top: 10pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  td, th { border: 1px solid #ccc; padding: 6pt 8pt; font-size: 10.5pt; }
  th { background: #D2F2EE; color: #115E59; }
  .meta { color: #666; font-size: 10pt; text-align: center; margin-bottom: 12pt; }
  .stage-card { border: 1px solid #0D9488; border-radius: 4pt; padding: 8pt 12pt; margin: 6pt 0; }
  .provider-card { border-left: 3px solid #0D9488; padding: 6pt 12pt; margin: 6pt 0; background: #F0FDFA; }
`;

/** 构建报告 HTML（供 Word 导出与 PDF 打印共用） */
export function buildFinanceReportHTML(data: FinancingData): string {
  // 基础体系表格
  const baseSystemTable = `
    <table>
      <tr><th>模块</th><th>内容</th></tr>
      <tr><td>定价体系</td><td>${data.baseSystem.pricing.map(i => `• ${i}`).join('<br>') || '—'}</td></tr>
      <tr><td>服务流程</td><td>${data.baseSystem.serviceProcess.map(i => `• ${i}`).join('<br>') || '—'}</td></tr>
      <tr><td>售后标准</td><td>${data.baseSystem.afterSales.map(i => `• ${i}`).join('<br>') || '—'}</td></tr>
      <tr><td>财务记账规则</td><td>${data.baseSystem.accountingRules.map(i => `• ${i}`).join('<br>') || '—'}</td></tr>
    </table>`;

  // 年度融资阶段
  const stageSections = data.stages.map(s => `
    <div class="stage-card">
      <h3>第${s.year}年 · ${s.roundName}</h3>
      <table>
        <tr><th>融资金额</th><td>${s.targetAmount} 万元</td><th>出让股权</th><td>${s.equityOffered}%</td></tr>
        <tr><th>预期估值</th><td>${s.valuation} 万元</td><th>时间</th><td>${s.timeline || '—'}</td></tr>
      </table>
      ${s.milestones.length > 0 ? `<p><strong>里程碑：</strong></p><ul>${s.milestones.map(m => `<li>${m}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  // 融资方推荐
  const institutions = data.providers.filter(p => p.type === 'institution');
  const individuals = data.providers.filter(p => p.type === 'individual');

  const providerSection = (list: typeof institutions, title: string) => `
    <h2>${title}（${list.length}）</h2>
    ${list.length === 0 ? '<p>暂无推荐</p>' : list.map(p => `
      <div class="provider-card">
        <h3>${p.name}</h3>
        <table>
          <tr><th>类型</th><td>${p.category}</td><th>关注领域</th><td>${p.focusArea || '—'}</td></tr>
          <tr><th>典型投资额度</th><td>${p.typicalTicket || '—'}</td><th></th><td></td></tr>
        </table>
        <p><strong>简介：</strong>${p.description || '—'}</p>
        <p><strong>匹配理由：</strong>${p.matchReason || '—'}</p>
        <p><strong>接触建议：</strong>${p.contactStrategy || '—'}</p>
      </div>`).join('')}`;

  // 总结
  const summarySection = data.summary
    ? `<h2>融资策略总结</h2><p style="white-space:pre-wrap">${data.summary}</p>`
    : '';

  return `
    <h1>融资规划方案</h1>
    <p class="meta">项目名称：${data.projectName} | 生成时间：${new Date(data.updatedAt).toLocaleString()}</p>
    <h2>基础体系搭建</h2>
    ${baseSystemTable}
    <h2>年度融资规划</h2>
    ${stageSections || '<p>暂无融资阶段数据</p>'}
    ${providerSection(institutions, '融资方推荐 — 机构投资方')}
    ${providerSection(individuals, '融资方推荐 — 个人投资方')}
    ${summarySection}
  `;
}

/** 导出 Word 文档 */
export function exportFinanceWord(data: FinancingData): void {
  const html = buildFinanceReportHTML(data);
  const fullDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><style>${WORD_CSS}</style></head>
    <body>${html}</body></html>`;
  downloadFile(fullDoc, `${data.projectName}-融资规划方案.doc`, 'application/msword');
}

/** 导出 PDF（通过浏览器打印对话框另存为PDF） */
export function exportFinancePDF(): void {
  document.body.classList.add('sage-finance-printing');
  window.print();
  setTimeout(() => document.body.classList.remove('sage-finance-printing'), 500);
}

/** 导出 Markdown（兜底） */
export function exportFinanceMarkdown(data: FinancingData): void {
  downloadFile(data.rawMarkdown, `${data.projectName}-融资规划方案.md`, 'text/markdown');
}
