const fs = require('fs');
const axios = require('axios');
const path = require('path');
require("dotenv").config();

async function downloadVideo() {
    try {
        const resultPath = path.join(__dirname, 'veo_result.json');
        if (!fs.existsSync(resultPath)) {
            console.error("❌ No se encontró veo_result.json. Ejecuta test_veo_flow.js primero.");
            return;
        }

        const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

        // Navegar la estructura de respuesta de Veo
        // Estructura vista: generateVideoResponse.generatedSamples[0].video.uri
        const uri = result.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

        if (!uri) {
            console.error("❌ No se encontró la URI del video en veo_result.json");
            console.log("Contenido JSON:", JSON.stringify(result, null, 2));
            return;
        }

        console.log(`🔗 URI encontrada: ${uri}`);

        // IMPORTANTE: Se necesita la API KEY para descargar el archivo
        const apiKey = process.env.GEMINI_API_KEY;
        const downloadUrl = `${uri}&key=${apiKey}`; // La URI ya tiene ?alt=media, usamos &

        console.log("⬇️  Descargando video...");

        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream'
        });

        const outputPath = path.join(__dirname, 'video_generado_veo.mp4');
        const writer = fs.createWriteStream(outputPath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Video descargado exitosamente: ${outputPath}`);
                resolve();
            });
            writer.on('error', (err) => {
                console.error("❌ Error escribiendo archivo:", err);
                reject(err);
            });
        });

    } catch (error) {
        console.error("❌ Error en la descarga:", error.message);
        if (error.response) {
            console.error("Detalles del servidor:", error.response.data);
        }
    }
}

downloadVideo();
