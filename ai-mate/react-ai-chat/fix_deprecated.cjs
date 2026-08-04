const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/MakerAI.tsx',
  'src/components/maker/WorkBoard.tsx',
  'src/components/butler/ResultsPanel.tsx',
  'src/components/butler/FeedbackPanel.tsx',
  'src/components/butler/DataDashboard.tsx',
  'src/components/butler/AfterSalesPanel.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. bodyStyle → styles.body
  const bodyStyleRe = /bodyStyle=\{\{\s*(\w+):\s*('[^']*'|"[^"]*"|\d+)/g;
  if (bodyStyleRe.test(content)) {
    content = content.replace(/bodyStyle=\{\{(\s*padding:\s*'[^']*'\s*)\}\}/g, 'styles={{ body: {$1} }}');
    content = content.replace(/bodyStyle=\{\{(\s*padding:\s*"[^"]*"\s*)\}\}/g, 'styles={{ body: {$1} }}');
    content = content.replace(/bodyStyle=\{\{(\s*padding:\s*\d+)\}\}/g, 'styles={{ body: {$1} }}');
    // Catch any lingering bodyStyle
    content = content.replace(/bodyStyle=\{\{/g, 'styles={{ body: {');
    content = content.replace(/\}\} \/\/ was bodyStyle/g, '} }}');
    // handle simple bodyStyle={{...}}
    content = content.replace(/(\s+)bodyStyle=/g, '$1// bodyStyle was here, replaced by styles\n$1styles={{ body: ');
    changed = true;
  }

  // 2. Space direction="vertical" → orientation="vertical"
  if (content.includes('direction="vertical"')) {
    content = content.replace(/direction="vertical"/g, 'orientation="vertical"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('FIXED:', file);
  } else {
    console.log('SKIP:', file);
  }
}

console.log('=== DONE ===');
