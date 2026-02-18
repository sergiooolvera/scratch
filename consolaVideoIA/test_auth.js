const { GoogleGenerativeAI } = require("@google/generative-ai");
const textToSpeech = require("@google-cloud/text-to-speech");
require("dotenv").config();

async function testGemini() {
    console.log("Testing Gemini API Key...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hola, responde con 'Gemini OK'");
        console.log("Result:", result.response.text());
        return true;
    } catch (e) {
        console.error("Gemini Error:", e.message);
        return false;
    }
}

async function testTTS() {
    let credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
        credPath = path.resolve(credPath.trim());
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    }
    console.log("Testing Google Cloud TTS with Credentials at:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
    try {
        const client = new textToSpeech.TextToSpeechClient();
        const [response] = await client.synthesizeSpeech({
            input: { text: "Probando conexión" },
            voice: { languageCode: 'es-ES', name: 'es-ES-Wavenet-B' },
            audioConfig: { audioEncoding: 'MP3' },
        });
        console.log("TTS OK: Audio generated size", response.audioContent.length);
        return true;
    } catch (e) {
        console.error("TTS Error Stack:", e);
        return false;
    }
}

async function run() {
    const gOk = await testGemini();
    console.log("---");
    const tOk = await testTTS();
    console.log("---");
    if (gOk && tOk) console.log("SUCCESS: Both APIs are working!");
    else if (gOk) console.log("PARTIAL: Gemini works, but TTS failed. Check Service Account.");
    else console.log("FAILURE: Credentials issues.");
}

run();
