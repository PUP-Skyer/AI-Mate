const f = require('fs');

const base = 'f:/program open/AI Entrepreneurship Empowerment Platform/program1/ai-mate/react-ai-chat/src/';
const files = [
  'components/scout/SupplierSearchPanel.tsx',
  'components/scout/PartnerRecommendationPanel.tsx',
  'components/scout/MarketAnalysisPanel.tsx',
  'components/scout/IndustryReportPanel.tsx',
  'components/scout/ResourceComparePanel.tsx',
  'components/sage/EntrepreneurshipPlanning.tsx',
  'components/sage/BenchmarkPanel.tsx',
];

files.forEach(rel => {
  const s = f.readFileSync(base + rel, 'utf8');
  let br = 0, pa = 0, sq = 0, dq = 0, bt = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1], p = s[i - 1];
    if (c === '{' && n !== '{') br++;
    if (c === '}') br--;
    if (c === '(') pa++;
    if (c === ')') pa--;
    if (c === "'" && p !== '\\') sq = 1 - sq;
    if (c === '"' && p !== '\\') dq = 1 - dq;
    if (c === '`' && p !== '\\') bt = 1 - bt;
  }
  const name = rel.split('/').pop();
  const ok = br === 0 && pa === 0 && sq === 0 && dq === 0 && bt === 0;
  console.log(name + ': ' + (ok ? 'OK' : 'FAIL') + ' br=' + br + ' pa=' + pa + ' sq=' + sq + ' dq=' + dq + ' bt=' + bt);
});
