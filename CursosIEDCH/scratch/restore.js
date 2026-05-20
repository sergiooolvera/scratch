const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\brain\\81661857-e691-4c01-9cad-550fbb10d992\\.system_generated\\logs\\transcript.jsonl';
const targetPath = 'C:\\Users\\sergi\\..gemini\\antigravity\\scratch\\CursosIEDCH\\app\\admin\\cursos\\page.tsx';

try {
    const lines = fs.readFileSync(logPath, 'utf8').split('\n');
    let fileContent = null;
    
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            const step = JSON.parse(line);
            
            if (step.tool_calls) {
                for (const tc of step.tool_calls) {
                    if (tc.name === 'write_to_file' && tc.args && tc.args.TargetFile && tc.args.TargetFile.toLowerCase().includes('page.tsx') && tc.args.TargetFile.toLowerCase().includes('admin')) {
                        let code = tc.args.CodeContent;
                        if (code.startsWith('"') && code.endsWith('"')) {
                            code = JSON.parse(code);
                        }
                        fileContent = code;
                        console.log(`Found complete write_to_file at step ${step.step_index}`);
                        break;
                    }
                }
            }
            if (fileContent) break;
        } catch (e) {
            // Ignore parse errors on individual lines
        }
    }
    
    if (fileContent) {
        // Fix target path just in case
        const actualTargetPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\app\\admin\\cursos\\page.tsx';
        fs.writeFileSync(actualTargetPath, fileContent, 'utf8');
        console.log('Successfully restored file from log!');
    } else {
        console.log('Could not find complete write_to_file in logs.');
    }
} catch (err) {
    console.error('Error:', err);
}
