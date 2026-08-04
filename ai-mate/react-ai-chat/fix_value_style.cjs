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

      // 1. valueStyle={...} → styles={{ content: {...} }}
      if (content.includes('valueStyle={')) {
        content = content.replace(/valueStyle=\{(\{)/g, 'styles={{ content: $1');
        content = content.replace(/(styles=\{\{ content: \{[^}]*)\}\}/g, '$1} }}');
        // More robust: valueStyle={{...}} → styles={{ content: {...} }}
        content = content.replace(/valueStyle=\{\{([^}]+)\}\}/g, 'styles={{ content: {$1} }}');
        // Handle nested braces: valueStyle={{...}} 
        const re = /valueStyle=\{\{\s*(color:\s*'[^']*',?\s*)(fontSize:\s*\d+,?\s*)(fontWeight:\s*'[^']*',?\s*)\}\}/g;
        content = content.replace(re, 'styles={{ content: { $1$2$3} }}');
        // Cleaner pass: any remaining valueStyle
        content = content.replace(/valueStyle=\{\{/g, 'styles={{ content: {');
        // Fix double braces from replacement
        changed = true;
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
