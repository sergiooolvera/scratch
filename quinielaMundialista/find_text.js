const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\quinielaMundialista');
files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    const lower = content.toLowerCase();
    
    if (lower.includes('bolsa') || lower.includes('costos') || lower.includes('lugar')) {
      console.log('Found in:', f);
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        const lLower = l.toLowerCase();
        if (lLower.includes('bolsa') || lLower.includes('costos') || lLower.includes('lugar')) {
          console.log(`  Line ${i+1}: ${l.trim()}`);
        }
      });
    }
  } catch (e) {}
});
