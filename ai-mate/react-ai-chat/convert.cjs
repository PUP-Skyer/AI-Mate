const fs = require('fs');

function convertGbkToUtf8(filePath) {
  const buf = fs.readFileSync(filePath);
  const text = new TextDecoder('gbk').decode(buf);
  fs.writeFileSync(filePath, text, 'utf8');
  console.log('OK:', filePath);
}

const dir = 'src/components/butler';
convertGbkToUtf8(dir + '/DataDashboard.tsx');
convertGbkToUtf8(dir + '/FAQPanel.tsx');
convertGbkToUtf8(dir + '/FeedbackPanel.tsx');
convertGbkToUtf8(dir + '/FeedbackForm.tsx');
convertGbkToUtf8(dir + '/OnboardingPanel.tsx');
console.log('ALL DONE');
