const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\brain\\81661857-e691-4c01-9cad-550fbb10d992\\.system_generated\\logs\\transcript.jsonl';
const targetPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\app\\admin\\cursos\\page.tsx';

function sanitizeJSONString(str) {
    let insideString = false;
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && (i === 0 || str[i-1] !== '\\')) {
            insideString = !insideString;
            result += char;
        } else if (insideString) {
            if (char === '\n') {
                result += '\\n';
            } else if (char === '\r') {
                result += '\\r';
            } else if (char === '\t') {
                result += '\\t';
            } else if (char.charCodeAt(0) < 32) {
                result += '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
            } else {
                result += char;
            }
        } else {
            result += char;
        }
    }
    return result;
}

try {
    const lines = fs.readFileSync(logPath, 'utf8').split('\n');
    let currentContent = null;
    let baseStep = -1;
    
    // Step 1: Find the base write_to_file
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            const sanitized = sanitizeJSONString(line);
            const step = JSON.parse(sanitized);
            if (step.tool_calls) {
                for (const tc of step.tool_calls) {
                    if (tc.name === 'write_to_file' && tc.args && tc.args.TargetFile && tc.args.TargetFile.toLowerCase().includes('page.tsx') && tc.args.TargetFile.toLowerCase().includes('admin')) {
                        let code = tc.args.CodeContent;
                        if (code.startsWith('"') && code.endsWith('"')) {
                            code = JSON.parse(code);
                        }
                        currentContent = code;
                        baseStep = step.step_index;
                        console.log(`Initialized content from step ${baseStep}`);
                        break;
                    }
                }
            }
            if (currentContent !== null) break;
        } catch (e) {
            // Ignore parse errors
        }
    }
    
    if (currentContent === null) {
        console.error("Could not find base write_to_file.");
        process.exit(1);
    }
    
    // Step 2: Apply subsequent replacement tool calls sequentially
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            const sanitized = sanitizeJSONString(line);
            const step = JSON.parse(sanitized);
            if (step.step_index <= baseStep) continue;
            
            if (step.tool_calls) {
                for (const tc of step.tool_calls) {
                    if (tc.args && tc.args.TargetFile && tc.args.TargetFile.toLowerCase().includes('page.tsx') && tc.args.TargetFile.toLowerCase().includes('admin')) {
                        if (tc.name === 'replace_file_content') {
                            let target = tc.args.TargetContent;
                            let replacement = tc.args.ReplacementContent;
                            
                            if (target.startsWith('"') && target.endsWith('"')) target = JSON.parse(target);
                            if (replacement.startsWith('"') && replacement.endsWith('"')) replacement = JSON.parse(replacement);
                            
                            if (currentContent.includes(target)) {
                                currentContent = currentContent.replace(target, replacement);
                                console.log(`Step ${step.step_index}: Applied replace_file_content`);
                            } else {
                                console.warn(`Step ${step.step_index}: Target content not found for replace_file_content!`);
                            }
                        } else if (tc.name === 'multi_replace_file_content') {
                            console.log(`Step ${step.step_index}: Processing multi_replace_file_content...`);
                            let chunks = tc.args.ReplacementChunks;
                            if (typeof chunks === 'string') {
                                chunks = JSON.parse(sanitizeJSONString(chunks));
                            }
                            
                            for (const chunk of chunks) {
                                let target = chunk.TargetContent;
                                let replacement = chunk.ReplacementContent;
                                
                                if (target.startsWith('"') && target.endsWith('"')) target = JSON.parse(target);
                                if (replacement.startsWith('"') && replacement.endsWith('"')) replacement = JSON.parse(replacement);
                                
                                if (currentContent.includes(target)) {
                                    currentContent = currentContent.replace(target, replacement);
                                    console.log(`  Applied chunk`);
                                } else {
                                    console.warn(`  Target content not found for chunk!`);
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`Error at line ${i}:`, e);
        }
    }
    
    fs.writeFileSync(targetPath, currentContent, 'utf8');
    console.log("Finished reconstruction successfully!");
} catch (err) {
    console.error('Error during reconstruction:', err);
}
