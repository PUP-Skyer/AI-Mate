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

// Check if we need to revert repair.cjs damage
files.forEach(rel => {
  const fp = base + rel;
  let s = f.readFileSync(fp, 'utf8');
  
  // Count all braces (including inside strings/templates - the verify script does this)
  let br = 0, pa = 0;
  for (const c of s) { if (c === '{') br++; if (c === '}') br--; if (c === '(') pa++; if (c === ')') pa--; }
  console.log(rel.split('/').pop() + ': raw braces=' + br + ' parens=' + pa);
  
  // The issue: repair.cjs added } at end of lines where {
  // was actually part of a template literal ${...} 
  // We need to remove the extra }
  
  // Strategy: remove excess } by counting properly
  // A { inside ${...} in backtick strings was miscounted
  // Let's fix this properly by parsing backtick strings
  let lines = s.split('\n');
  let fixed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    let net = 0;
    let inSQ = false, inDQ = false, inBT = false;
    let btDepth = 0; // nested ${...} inside backtick
    for (let j = 0; j < l.length; j++) {
      const c = l[j], p = l[j-1];
      if (inSQ) { if (c === "'" && p !== '\\') inSQ = false; }
      else if (inDQ) { if (c === '"' && p !== '\\') inDQ = false; }
      else if (inBT) {
        if (c === '`' && p !== '\\') { inBT = false; }
        else if (c === '{' && p === '$') btDepth++;
        else if (c === '}') btDepth--;
        // Don't count braces inside backtick strings
      } else {
        if (c === "'") inSQ = true;
        else if (c === '"') inDQ = true;
        else if (c === '`') inBT = true;
        else if (c === '{') net++;
        else if (c === '}') net--;
      }
    }
    
    // If net < 0, there are extra } - remove from end of line
    if (net < 0) {
      let extra = -net;
      let newl = l;
      // Remove the last extra } characters (only if at end of line or before whitespace)
      for (let k = 0; k < extra; k++) {
        // Find last } in the JSX part (not in strings)
        let lastBrace = -1;
        let inS = false, inD = false, inB = false;
        for (let j = newl.length - 1; j >= 0; j--) {
          const c = newl[j], p = newl[j-1];
          if (inS) { if (c === "'" && p !== '\\') inS = false; continue; }
          if (inD) { if (c === '"' && p !== '\\') inD = false; continue; }
          if (inB) { if (c === '`' && p !== '\\') inB = false; continue; }
          if (c === "'") { inS = true; continue; }
          if (c === '"') { inD = true; continue; }
          if (c === '`') { inB = true; continue; }
          if (c === '}') { lastBrace = j; break; }
        }
        if (lastBrace >= 0) {
          newl = newl.substring(0, lastBrace) + newl.substring(lastBrace + 1);
          fixed++;
        }
      }
      lines[i] = newl;
    }
  }
  
  if (fixed > 0) {
    f.writeFileSync(fp, lines.join('\n'), 'utf8');
    console.log('  -> Removed ' + fixed + ' extra }');
  } else {
    console.log('  -> No extra } to remove');
  }
  
  // Re-verify
  const final = f.readFileSync(fp, 'utf8');
  let br2 = 0;
  for (const c of final) { if (c === '{') br2++; if (c === '}') br2--; }
  console.log('  -> After: braces=' + br2);
});
