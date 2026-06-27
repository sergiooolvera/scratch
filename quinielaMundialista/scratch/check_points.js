const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.vercel') return;
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

const files = walk('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\quinielaMundialista\\src');
files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('points_earned') || content.includes('is_exact') || content.includes('ptsExact') || content.includes('ptsWinner')) {
      console.log('Found in:', f);
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        if (l.includes('points_earned') || l.includes('is_exact') || l.includes('=== 3') || l.includes('=== 1') || l.includes('ptsExact') || l.includes('ptsWinner')) {
          console.log(`  Line ${i+1}: ${l.trim()}`);
        }
      });
    }
  } catch (e) {}
});
