const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory() && !f.startsWith('.') && f !== 'node_modules') {
      walk(fp);
    } else if (f.endsWith('.tsx')) {
      let content = fs.readFileSync(fp, 'utf8');
      let changed = false;

      // Replace only Timeline items dot: → icon:
      // Pattern: dot: <some JSX> (usually followed by color: xxx then children:)
      if (content.includes('dot:') && content.includes('Timeline')) {
        const before = content;
        content = content.replace(/(\s+)dot:(\s*</g, '$1icon:$2');
        if (content !== before) changed = true;
      }

      // Replace Timeline items children: → content:  
      // Only when in a Timeline context (dot: or icon: nearby)
      if (content.includes('children:') && content.includes('Timeline')) {
        const before = content;
        // This is tricky - we only want Timeline items children, not React children props
        // The Timeline children: pattern has color: before it typically
        content = content.replace(/(\s+)color:(\s*'[^']*'\s*),\s*\n\s*children:(\s*\()/g, '$1color:$2,\n$1content:$3');
        // Also catch dot/icon then children
        content = content.replace(/(\s+)(dot|icon):(\s*<[^]*?\n)\s*children:(\s*\()/g, '$1$2:$3$1content:$4');
        if (content !== before) changed = true;
      }

      if (changed) {
        fs.writeFileSync(fp, content, 'utf8');
        console.log('FIXED:', fp);
      }
    }
  }
}

walk('src');
console.log('=== DONE ===');
