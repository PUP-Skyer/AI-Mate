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
  let s = f.readFileSync(fp, 'utf8');

  // Strategy: Add missing } back to lines that should have balanced braces
  // We can't restore lost characters but we can make the syntax valid again
  
  // Fix 1: Template literal ${ that are broken (missing $, {, or })
  // Lines with unbalanced braces in template strings - add closing }
  
  // Fix 2: Restore common patterns that lost their ? in ternary operators
  // Pattern: 'condition  'true' : 'false'  → add ?
  
  let lines = s.split('\n');
  let fixed = 0;
  let bracesInLine = 0; // track braces across lines
  
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    const orig = l;
    
    // Count braces on this line
    let open = 0, close = 0;
    // Simple counting (ignore strings/templates for now)
    let inSQuote = false, inDQuote = false, inTemplate = false;
    for (let j = 0; j < l.length; j++) {
      const c = l[j], p = l[j-1];
      if (!inSQuote && !inDQuote && !inTemplate) {
        if (c === "'") inSQuote = true;
        else if (c === '"') inDQuote = true;
        else if (c === '`') inTemplate = true;
        else if (c === '{') open++;
        else if (c === '}') close++;
      } else if (inSQuote && c === "'" && p !== '\\') inSQuote = false;
      else if (inDQuote && c === '"' && p !== '\\') inDQuote = false;
      else if (inTemplate && c === '`' && p !== '\\') inTemplate = false;
    }
    
    const net = open - close;
    if (net > 0) {
      // This line needs more closing braces
      // Add them before line-ending comments or at end of line
      const commentIdx = l.lastIndexOf('//');
      let insertPos = l.length;
      if (commentIdx > 0 && (l[commentIdx-1] === ' ' || l[commentIdx-1] === '\t')) {
        insertPos = commentIdx;
      }
      // Remove trailing whitespace before insertion
      while (insertPos > 0 && l[insertPos-1] === ' ') insertPos--;
      
      l = l.substring(0, insertPos) + '}'.repeat(net) + l.substring(insertPos);
      lines[i] = l;
      fixed += net;
    }
  }
  
  if (fixed > 0) {
    f.writeFileSync(fp, lines.join('\n'), 'utf8');
    console.log(rel.split('/').pop() + ': added ' + fixed + ' }');
  } else {
    console.log(rel.split('/').pop() + ': no changes needed');
  }
});
