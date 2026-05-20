const fs = require('fs');

const logPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\brain\\81661857-e691-4c01-9cad-550fbb10d992\\.system_generated\\logs\\transcript.jsonl';

try {
    const lines = fs.readFileSync(logPath, 'utf8').split('\n');
    const targetLine = lines[822]; // the index that errored
    console.log("Line 822 length:", targetLine.length);
    console.log("Line 822 snippet:", targetLine.substring(0, 500));
} catch (err) {
    console.error(err);
}
