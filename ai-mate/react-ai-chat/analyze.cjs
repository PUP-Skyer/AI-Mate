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

// SIMPLE FIX: Add missing closing braces by inserting them
// right before each line that decreases a multi-line brace depth deficit
files.forEach(rel => {
  const fp = base + rel;
  let s = f.readFileSync(fp, 'utf8');
  let lines = s.split('\n');
  
  // Track brace depth across lines, excluding string/template content
  let depth = 0;
  let minDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let inS = false, inD = false, inB = false;
    for (let j = 0; j < l.length; j++) {
      const c = l[j], p = l[j-1];
      if (inS) { if (c === "'" && p !== '\\') inS = false; continue; }
      if (inD) { if (c === '"' && p !== '\\') inD = false; continue; }
      if (inB) {
        if (c === '`' && p !== '\\') inB = false;
        // Don't count braces inside backtick strings
        continue;
      }
      if (c === "'") { inS = true; continue; }
      if (c === '"') { inD = true; continue; }
      if (c === '`') { inB = true; continue; }
      if (c === '{') depth++;
      if (c === '}') depth--;
      if (depth < minDepth) minDepth = depth;
    }
  }
  
  // Total missing closing braces
  const missing = -(depth + minDepth) + (-minDepth);
  console.log(rel.split('/').pop() + ': depth=' + depth + ' minDepth=' + minDepth + ' missing=' + missing);
});
