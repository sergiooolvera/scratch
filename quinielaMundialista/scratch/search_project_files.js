const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

try {
  const files = walk('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\peluches');
  console.log(`Scanning ${files.length} project files...`);
  
  files.forEach(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        const lower = l.toLowerCase();
        if (
          lower.includes('postgres://') ||
          lower.includes('database_url') ||
          (lower.includes('pass') && (lower.includes('db') || lower.includes('postgres') || lower.includes('supabase')))
        ) {
          console.log(`[${path.relative('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\quinielaMundialista', f)}:L${i+1}] ${l.trim()}`);
        }
      });
    } catch (e) {}
  });
} catch (e) {
  console.error(e);
}
