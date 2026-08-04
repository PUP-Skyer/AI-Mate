const fs = require('fs');
const path = require('path');

const replaceMap = [
  [/color:\s*'#666666'/g, "color: 'var(--text-secondary)'"],
  [/color:\s*'#666'/g, "color: 'var(--text-secondary)'"],
  [/color:\s*"#666666"/g, 'color: "var(--text-secondary)"'],
  [/color:\s*"#666"/g, 'color: "var(--text-secondary)"'],
  [/color:\s*'#999999'/g, "color: 'var(--text-muted)'"],
  [/color:\s*'#999'/g, "color: 'var(--text-muted)'"],
  [/color:\s*"#999999"/g, 'color: "var(--text-muted)"'],
  [/color:\s*"#999"/g, 'color: "var(--text-muted)"'],
  [/color:\s*'#888888'/g, "color: 'var(--text-muted)'"],
  [/color:\s*'#888'/g, "color: 'var(--text-muted)'"],
  [/color:\s*'#777777'/g, "color: 'var(--text-muted)'"],
  [/color:\s*'#777'/g, "color: 'var(--text-muted)'"],
  [/color:\s*'#aaaaaa'/g, "color: 'var(--text-secondary)'"],
  [/color:\s*'#aaa'/g, "color: 'var(--text-secondary)'"],
  [/color:\s*'#bbb'/g, "color: 'var(--text-secondary)'"],
  [/color:\s*'#bbbbbb'/g, "color: 'var(--text-secondary)'"],
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory() && !f.startsWith('.') && f !== 'node_modules') {
      walk(fp);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      let content = fs.readFileSync(fp, 'utf8');
      let changed = false;
      for (const [pattern, replacement] of replaceMap) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fp, content, 'utf8');
        console.log('OK:', fp);
      }
    }
  }
}

walk('src');
console.log('=== DONE ===');
