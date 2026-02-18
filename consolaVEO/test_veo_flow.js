const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Configuración de API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Genera un prompt optimizado para video usando Gemini
 * @param {string} topic - El tema del video
 * @param {string} duration - Duración aproximada o estilo
 */
async function generateVideoPrompt(topic, duration) {
    console.log(`\n📝 Generando prompt de video para: "${topic}"...`);
    // Usar un modelo estándar para texto
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
        Eres un experto en creación de prompts para modelos de generación de video AI como Google Veo.
        Tu tarea es crear un prompt detallado y visualmente rico basado en el siguiente tema: "${topic}".
        
        El prompt debe ser en INGLÉS (el modelo Veo funciona mejor con prompts en inglés).
        Debe describir:
        - Sujeto principal
        - Acción o movimiento
        - Iluminación
        - Estilo de cámara (ángulos, lentes)
        - Estilo artístico (fotorealista, cinematico, 4k, etc.)
        
        Solo devuelve el prompt en inglés, sin explicaciones adicionales.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const videoPrompt = response.text().trim();
        console.log(`✅ Prompt generado:\n"${videoPrompt}"`);
        return videoPrompt;
    } catch (error) {
        console.error("❌ Error generando prompt:", error);
        throw error;
    }
}

const axios = require('axios');

/**
 * Genera video usando el modelo Veo via REST API (predictLongRunning)
 * @param {string} videoPrompt - El prompt para generar el video
 */
async function generateVideo(videoPrompt) {
    console.log("\n🎥 Iniciando generación de video con Veo (REST API Key)...");

    // Usar API Key (más simple para el usuario si tiene Billing)
    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL_NAME = "veo-2.0-generate-001";
    // Endpoint para predictLongRunning
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:predictLongRunning?key=${API_KEY}`;

    const body = {
        instances: [
            {
                prompt: videoPrompt
            }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: "16:9"
        }
    };

    try {
        console.log(`⏳ Enviando solicitud POST a ${url}...`);
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Operación iniciada. ID:", response.data.name);

        // Iniciar Polling
        const operationName = response.data.name;
        let operation = response.data;

        process.stdout.write("⏳ Procesando video: ");

        while (!operation.done) {
            process.stdout.write(".");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5s

            const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`;
            const pollRes = await axios.get(pollUrl);
            operation = pollRes.data;
        }

        console.log("\n✅ Operación completada.");

        if (operation.error) {
            throw new Error(`Error en operación: ${JSON.stringify(operation.error)}`);
        }

        // El resultado debe estar en operation.response
        const result = operation.response;
        console.log("📦 Resultado:", JSON.stringify(result, null, 2));

        fs.writeFileSync('veo_result.json', JSON.stringify(result, null, 2));

        return result;

    } catch (error) {
        console.error("\n❌ Error generando video con Veo (REST):");

        const errorLog = {
            message: error.message,
            response: error.response ? error.response.data : "No response data",
            details: error
        };

        console.error(JSON.stringify(errorLog, null, 2));
        fs.writeFileSync('last_rest_error.json', JSON.stringify(errorLog, null, 2));
    }
}

async function downloadVideo(uri) {
    try {
        console.log(`⬇️  Descargando video de: ${uri}`);
        const apiKey = process.env.GEMINI_API_KEY;
        const downloadUrl = `${uri}&key=${apiKey}`; // La URI ya tiene ?alt=media

        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream'
        });

        const outputPath = path.join(__dirname, `video_${Date.now()}.mp4`);
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Video guardado en: ${outputPath}`);
                resolve(outputPath);
            });
            writer.on('error', reject);
        });
    } catch (e) {
        console.error("❌ Error descargando video:", e.message);
    }
}

async function main() {
    const topic = process.argv[2] || "Un paisaje futurista cyberpunk";
    const duration = process.argv[3] || "corto";

    try {
        let videoPrompt;
        try {
            videoPrompt = await generateVideoPrompt(topic, duration);
        } catch (promptError) {
            console.log("⚠️ Falló la generación de prompt (posiblemente cuota). Usando fallback...");
            videoPrompt = `A cinematic, high-quality video about ${topic}, 4k, realistic lighting.`;
        }

        if (videoPrompt) {
            const result = await generateVideo(videoPrompt);
            if (result && result.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                await downloadVideo(result.generateVideoResponse.generatedSamples[0].video.uri);
            }
        }
    } catch (error) {
        console.error("💥 Error en el flujo principal:", error);
        fs.writeFileSync('fatal_error.json', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
    }
}

main();
