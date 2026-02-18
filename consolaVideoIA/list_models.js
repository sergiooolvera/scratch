const axios = require('axios');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

async function list() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const res = await axios.get(url);
        let output = "AVAILABLE MODELS:\n";
        res.data.models.forEach(m => {
            output += `- ${m.name} (${m.displayName})\n`;
            if (m.name.includes('veo')) {
                fs.appendFileSync('model_details.json', JSON.stringify(m, null, 2) + "\n");
            }
        });
        const outPath = path.join(__dirname, 'models_list.txt');
        fs.writeFileSync(outPath, output);
        console.log("Done writing to: " + outPath);
    } catch (e) {
        console.error("List Error:", e.message);
    }
}

list();
