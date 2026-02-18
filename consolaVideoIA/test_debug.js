const fs = require('fs');
const path = require('path');

async function debugRun() {
    const logFile = path.join(__dirname, 'debug_error.log');
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, '--- Debug Start ---\n');

    try {
        log("Loading dependencies...");
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const textToSpeech = require("@google-cloud/text-to-speech");
        require("dotenv").config();

        log("Env Loaded. Gemini Key: " + (process.env.GEMINI_API_KEY ? "Present" : "Missing"));
        log("Creds Path: " + process.env.GOOGLE_APPLICATION_CREDENTIALS);

        log("Testing Gemini...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        try {
            log("Trying gemini-2.5-flash...");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent("Respond 'OK'");
            log("Gemini OK: " + result.response.text().trim());
        } catch (ge) {
            log("Gemini 2.5 Flash FAILED: " + ge.message);
            try {
                log("Trying gemini-2.0-flash...");
                const modelP = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const resP = await modelP.generateContent("Respond 'OK'");
                log("Gemini 2.0 Flash OK: " + resP.response.text().trim());
            } catch (ep) {
                log("Gemini fallback FAILED: " + ep.message);
            }
        }

        log("Testing TTS...");
        try {
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS.trim());
            }
            const client = new textToSpeech.TextToSpeechClient();
            log("TTS Client Initialized.");
            const [response] = await client.synthesizeSpeech({
                input: { text: "Todo funcionando correctamente" },
                voice: { languageCode: 'es-ES', name: 'es-ES-Wavenet-B' },
                audioConfig: { audioEncoding: 'MP3' },
            });
            log("TTS OK. Size: " + response.audioContent.length);
        } catch (te) {
            log("TTS FAILED: " + te.message);
        }

    } catch (e) {
        log("FATAL ERROR: " + e.message);
    }
}

debugRun();
