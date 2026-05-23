const fs = require('fs');
const path = require('path');

function walk(dir, depth = 0) {
  if (depth > 3) return; // Prevent going too deep
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
        if (file.startsWith('.env') || file.includes('supabase') || file.endsWith('.sql')) {
          results.push(fullPath);
        }
      }
    });
  } catch (e) {}
  return results;
}

const files = walk('c:\\Users\\sergi\\.gemini\\antigravity\\scratch');
console.log(`Found ${files.length} candidate files:`);
files.forEach(f => {
  console.log(f);
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('password') || content.includes('postgres://') || content.includes('DATABASE_URL') || content.includes('POSTGRES_')) {
      console.log(`--- Content of ${f} ---`);
      console.log(content);
      console.log('--------------------------------\n');
    }
  } catch (e) {}
});
