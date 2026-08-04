const fs = require('fs');

// Fix Alert message= → title=
for (const f of ['src/components/maker/WorkBoard.tsx', 'src/components/sage/EntrepreneurshipPlanning.tsx']) {
  let c = fs.readFileSync(f, 'utf8');
  let chg = false;
  c = c.replace(/(\s+)message="([^"]+)"/g, '$1title="$2"');
  if (c.includes("message='")) chg = true;
  c = c.replace(/(\s+)message='([^']+)'/g, "$1title='$2'");
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// Fix Steps items description → content
for (const f of ['src/components/maker/WorkBoard.tsx', 'src/components/butler/OnboardingPanel.tsx']) {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('description:')) {
    c = c.replace(/description:\s*'([^']*)'/g, "content: '$1'");
    fs.writeFileSync(f, c, 'utf8');
    console.log('STEPS OK:', f);
  } else {
    console.log('STEPS SKIP:', f);
  }
}

console.log('=== DONE ===');
