const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const publicDir = 'c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\public';
const files = ['CONSTACIA 1.pdf', 'CONSTANCIA 2.pdf', 'CONSTANCIA 3.pdf'];

async function readPDFs() {
    for (const file of files) {
        const filePath = path.join(publicDir, file);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${file}`);
            continue;
        }
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            console.log(`\n========================================`);
            console.log(`CONTENT OF: ${file}`);
            console.log(`========================================`);
            console.log(data.text.trim());
        } catch (error) {
            console.error(`Error reading ${file}:`, error);
        }
    }
}

readPDFs();
