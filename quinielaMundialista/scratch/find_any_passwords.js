const fs = require('fs');
const path = require('path');

function walk(dir, depth = 0) {
  if (depth > 5) return [];
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

const root = 'c:\\Users\\sergi\\.gemini\\antigravity\\scratch';
console.log("Walking files in", root);
const files = walk(root);

console.log(`Found ${files.length} total files. Searching for password patterns...`);

files.forEach(f => {
  try {
    const stat = fs.statSync(f);
    if (stat.size > 1000000) return; // Skip large files
    const content = fs.readFileSync(f, 'utf8');
    
    // Look for db passwords
    const matches = content.match(/(?:password|pass|passwd|db_password|db_pass)\s*[:=]\s*["']([^"']+)["']/gi);
    if (matches) {
      console.log(`Match in ${f}:`);
      matches.forEach(m => console.log("  ", m));
    }

    const connStrings = content.match(/postgres:\/\/[^\s"']+/gi);
    if (connStrings) {
      console.log(`Connection string in ${f}:`);
      connStrings.forEach(c => console.log("  ", c));
    }
  } catch (e) {}
});
