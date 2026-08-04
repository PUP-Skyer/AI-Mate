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

function fixBraces(s) {
  // Approach: parse the full string character by character,
  // tracking JSX brace context vs template literal context
  let result = '';
  let i = 0;
  let jsxBraceDepth = 0;
  let errors = 0;
  
  while (i < s.length) {
    const c = s[i];
    
    // Check for backtick template literal start
    if (c === '`') {
      result += c;
      i++;
      // Parse template literal content
      while (i < s.length && s[i] !== '`') {
        if (s[i] === '\\') {
          result += s[i] + (s[i+1] || '');
          i += 2;
          continue;
        }
        if (s[i] === '$' && s[i+1] === '{') {
          result += '${';
          i += 2;
          let templateBraceDepth = 1;
          while (i < s.length && templateBraceDepth > 0) {
            if (s[i] === '`' && s[i-1] !== '\\') break; // end of template literal
            if (s[i] === '{') templateBraceDepth++;
            if (s[i] === '}') templateBraceDepth--;
            if (templateBraceDepth > 0) { result += s[i]; i++; }
          }
          if (templateBraceDepth === 0 && i < s.length && s[i] === '}') {
            result += '}';
            i++;
          } else if (templateBraceDepth > 0 && (i >= s.length || s[i] === '`')) {
            // Missing closing braces in template literal!
            result += '}'.repeat(templateBraceDepth);
            errors++;
          } else {
            // s[i] should be '}'
            result += '}';
            if (s[i] === '}') i++;
            else errors++;
          }
          continue;
        }
        if (s[i] === '`') break;
        result += s[i];
        i++;
      }
      if (i < s.length && s[i] === '`') { result += '`'; i++; }
      continue;
    }
    
    // Check for single/double quote strings
    if (c === "'" || c === '"') {
      const quote = c;
      result += c;
      i++;
      while (i < s.length && s[i] !== quote) {
        if (s[i] === '\\') { result += s[i] + (s[i+1] || ''); i += 2; }
        else { result += s[i]; i++; }
      }
      if (i < s.length) { result += s[i]; i++; }
      continue;
    }
    
    // Track JSX braces
    if (c === '{') jsxBraceDepth++;
    if (c === '}') jsxBraceDepth--;
    
    result += c;
    i++;
  }
  
  return { fixed: result, errors };
}

files.forEach(rel => {
  const fp = base + rel;
  let s = f.readFileSync(fp, 'utf8');
  const { fixed, errors } = fixBraces(s);
  
  if (errors > 0) {
    f.writeFileSync(fp, fixed, 'utf8');
    console.log(rel.split('/').pop() + ': fixed ' + errors + ' template braces');
  } else {
    console.log(rel.split('/').pop() + ': OK');
  }
  
  // Verify
  const final = f.readFileSync(fp, 'utf8');
  let br = 0;
  for (const c of final) { if (c === '{') br++; if (c === '}') br--; }
  console.log('  braces=' + br);
});
