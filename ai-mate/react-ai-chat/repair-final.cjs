const f = require('fs');
const path = require('path');

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

// Known original texts vs corrupted texts
const fixes = [
  // ---- SupplierSearchPanel.tsx ----
  [/AI 供应商分\?/g, 'AI 供应商分类'],
  [/icon: '\?/g, (m) => 'icon: \''], // keep what's there, just remove extra ?
  
  // ---- PartnerRecommendationPanel.tsx ----
  [/'0-100\? '/g, "'0-100万'"],
  [/'100-500\? '/g, "'100-500万'"],
  [/'500-1000\? '/g, "'500-1000万'"],
  [/'1000-5000\? '/g, "'1000-5000万'"],
  [/'5000万以 '/g, "'5000万以上'"],
  
  // ---- MarketAnalysisPanel.tsx ----
  [/'制, color/g, "'制造', color"],
  
  // ---- EntrepreneurshipPlanning.tsx ----
  [/import \{\s*\n/g, 'import {\n'],
  [/(\w+),\n from '@ant-design/g, '$1,\n} from \'@ant-design'],
  
  // ---- ResourceComparePanel.tsx ----
  // interface already fixed
  
  // ---- General fixes ----
  // Fix broken emoji icons (remove corrupted char and close string properly)
  [/icon: '([^']*)\? '/g, "icon: '$1'"],
  [/label: '([^']*)\? '/g, "label: '$1'"],
  
  // Fix broken ? in template literals (like ${selectedCompetitor.marketShare}%)
  // These are harder - the ? often replaced part of the expression
  [/\$\{([^}]*?)\?([^}]*?)\}/g, '${$1$2}'],
  
  // Fix ? followed immediately by '}' 
  [/\(([^)]*)\?\)/g, '($1)'],
  
  // Fix ? that replaced closing quote
  [/(\w+)', label: '([^']*)\?/g, "$1', label: '$2',"],
];

let totalFixes = 0;
files.forEach(rel => {
  const fp = base + rel;
  let content = f.readFileSync(fp, 'utf8');
  const originalLen = content.length;
  
  fixes.forEach(([pattern, replacement]) => {
    const before = content.length;
    content = content.replace(pattern, replacement);
    if (content.length !== before) totalFixes++;
  });
  
  f.writeFileSync(fp, content, 'utf8');
  console.log(rel.split('/').pop() + ': ' + originalLen + ' -> ' + content.length + ' chars');
});

console.log('\nTotal pattern fixes applied: ' + totalFixes);
