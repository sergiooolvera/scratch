const fs = require('fs');
const path = require('path');

function walk(dir, depth = 0) {
  if (depth > 3) return [];
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
        results.push(fullPath);
      }
    });
  } catch (e) {}
  return results;
}

const files = walk('c:\\Users\\sergi\\.gemini\\antigravity\\scratch');
console.log(`Searching pooler in ${files.length} files...`);

files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('pooler.supabase.com')) {
      console.log(`--- MATCH in: ${f} ---`);
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        console.log(`  Line ${i+1}: ${l.trim()}`);
      });
    }
  } catch (e) {}
});
