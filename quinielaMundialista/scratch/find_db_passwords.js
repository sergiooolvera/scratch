const fs = require('fs');
const path = require('path');

function walk(dir, depth = 0) {
  if (depth > 4) return [];
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'tmp') return;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(fullPath, depth + 1));
      } else {
        const lower = file.toLowerCase();
        if (lower.startsWith('.env') || lower.endsWith('.sql') || lower.endsWith('.json') || lower.endsWith('.js') || lower.endsWith('.ts')) {
          results.push(fullPath);
        }
      }
    });
  } catch (e) {}
  return results;
}

const files = walk('c:\\Users\\sergi\\.gemini\\antigravity\\scratch');
console.log(`Scanning ${files.length} configuration files...`);

files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      const lower = l.toLowerCase();
      // Look for lines containing password and not in standard ignore list
      if ((lower.includes('pass') || lower.includes('key') || lower.includes('postgres://') || lower.includes('db_') || lower.includes('database_url')) && 
          !lower.includes('stripe_') && !lower.includes('resend_') && !lower.includes('smtp_') && !lower.includes('public_key')) {
        // Print the filename and matching line
        console.log(`[${path.basename(f)}:L${i+1}] ${l.trim()}`);
      }
    });
  } catch (e) {}
});
