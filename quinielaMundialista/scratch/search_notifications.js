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
    const lower = content.toLowerCase();
    if (lower.includes('limpiar todo') || lower.includes('notificaciones') || lower.includes('clearAll') || lower.includes('clear_all')) {
      console.log('Found in:', f);
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        const lLower = l.toLowerCase();
        if (lLower.includes('limpiar') || lLower.includes('notific') || lLower.includes('clear') || lLower.includes('borrar')) {
          console.log(`  Line ${i+1}: ${l.trim()}`);
        }
      });
    }
  } catch (e) {}
});
