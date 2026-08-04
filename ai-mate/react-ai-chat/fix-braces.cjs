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
  const fp = base + rel;
  let lines = f.readFileSync(fp, 'utf8').split('\n');
  let fixed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    
    // Fix `=> {}` where next line is indented code (not empty function)
    if (l.trimEnd().endsWith('=> {}') && i + 1 < lines.length && lines[i + 1].trim()) {
      lines[i] = l.replace(/=> \{}$/, '=> {');
      fixed++;
    }
    
    // Fix `style={{}}` -> `style={{` (when followed by style content)
    if (l.includes('style={{}}') && i + 1 < lines.length && lines[i + 1].trim()) {
      lines[i] = l.replace('style={{}}', 'style={{');
      fixed++;
    }
    
    // Fix `{[}` -> `{[`
    if (l.trimEnd().endsWith('{[}') && i + 1 < lines.length) {
      lines[i] = l.replace(/\{\[\}$/, '{[');
      fixed++;
    }
    
    // Fix `onError={(e) => {}}` etc -> `onError={(e) => {`
    if (/=> \{}$/.test(l.trimEnd()) && i + 1 < lines.length && lines[i + 1].trim()) {
      lines[i] = l.replace(/=> \{}$/, '=> {');
      fixed++;
    }
    
    // Fix `map((...) => {}` -> `map((...) => {`
    if (/map\(.*=> \{}$/.test(l.trimEnd()) && i + 1 < lines.length && lines[i + 1].trim()) {
      lines[i] = l.replace(/=> \{}$/, '=> {');
      fixed++;
    }
  }
  
  if (fixed > 0) {
    f.writeFileSync(fp, lines.join('\n'), 'utf8');
    console.log(rel.split('/').pop() + ': fixed ' + fixed + ' arrow/brace issues');
  } else {
    console.log(rel.split('/').pop() + ': no issues');
  }
});
