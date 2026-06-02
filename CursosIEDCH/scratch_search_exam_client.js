const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'cursos', '[id]', 'examen', 'ExamenClient.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("=== Matching lines in ExamenClient.tsx ===");
lines.forEach((line, index) => {
  if (/submitExamen|respuestas|preguntas|handleAnswer|state/i.test(line)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
