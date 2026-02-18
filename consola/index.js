const { getWikiContent, generateLongAudio, assembleVideoDynamic } = require('./generator');
const fs = require('fs-extra');
const path = require('path');

async function main() {
    const topic = process.argv[2] || "Segunda Guerra Mundial";
    console.log(`[DEBUG] Inicio: ${topic}`);

    try {
        const fullText = await getWikiContent(topic);
        if (!fullText) {
            console.error("[ERROR] No se obtuvo texto de Wikipedia.");
            return;
        }
        const { finalAudioPath, segments } = await generateLongAudio(fullText);
        console.log(`\nAudio completo generado: ${finalAudioPath}`);

        const videoPath = path.join(__dirname, 'output', 'documental_dinamico.mp4');
        await assembleVideoDynamic(finalAudioPath, segments, topic, videoPath);

        console.log(`\n--- DOCUMENTAL DINÁMICO COMPLETADO ---`);
        console.log(`Ruta: ${videoPath}`);

    } catch (err) {
        console.error("[CRITICAL ERROR]", err);
    }
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    process.exit(1);
});

main();
