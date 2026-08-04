const fs = require('fs');
const path = require('path');

const targets = [
  'src/components/maker/WorkBoard.tsx',
  'src/components/sage/MarketingPlanPanel.tsx',
  'src/components/sage/DataAnalysisPanel.tsx',
  'src/pages/finance/FinancePage.tsx',
  'src/pages/expert/ExpertPage.tsx',
];

for (const fp of targets) {
  let c = fs.readFileSync(fp, 'utf8');
  let changed = false;

  // valueStyle={{...}} => styles={{ content: {...} }}
  const re = /(\s+)valueStyle=\{\{(.+?)\}\}/gs;
  const matches = [...c.matchAll(re)];
  if (matches.length > 0) {
    changed = true;
    for (const m of matches) {
      const indent = m[1];
      const inner = m[2];
      c = c.replace(m[0], `${indent}styles={{ content: {${inner}} }}`);
    }
  }

  if (changed) {
    fs.writeFileSync(fp, c, 'utf8');
    console.log('OK:', fp);
  } else {
    console.log('SKIP:', fp);
  }
}
console.log('=== DONE ===');
