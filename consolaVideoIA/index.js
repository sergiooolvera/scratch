const VideoGenerator = require('./engine');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log("==========================================");
    console.log("   GENERADOR DE DOCUMENTALES GOOGLE AI    ");
    console.log("==========================================");

    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️  ADVERTENCIA: GEMINI_API_KEY no encontrada en .env");
    }

    rl.question("\n🎥 Ingresa el tema del documental: ", async (topic) => {
        rl.question("⏱️  Duración deseada (minutos, default 10): ", async (duration) => {
            const mins = parseInt(duration) || 10;

            const generator = new VideoGenerator(topic, mins);
            await generator.run();

            rl.close();
        });
    });
}

main();
