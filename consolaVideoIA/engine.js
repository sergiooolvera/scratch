const { GoogleGenerativeAI } = require("@google/generative-ai");
const textToSpeech = require("@google-cloud/text-to-speech");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

// Configuración de FFmpeg
const ffmpegPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\consola\\ffmpeg_dist\\bin\\ffmpeg.exe';
const ffprobePath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\consola\\ffmpeg_dist\\bin\\ffprobe.exe';
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Clientes de API (Inicializados perezosamente para asegurar env vars)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
let ttsClient = null;

function getTTSClient() {
    if (!ttsClient) {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Normalizar ruta para Windows
            process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().replace(/\//g, '\\'));
        }
        ttsClient = new textToSpeech.TextToSpeechClient();
    }
    return ttsClient;
}

class VideoGenerator {
    constructor(topic, durationMinutes = 10) {
        this.topic = topic;
        this.durationMinutes = durationMinutes;
        this.runId = Date.now();
        this.baseDir = path.join(__dirname, 'runs', `run_${this.runId}`);
        this.outputsDir = path.join(this.baseDir, 'outputs');
        this.tempDir = path.join(this.baseDir, 'temp');
    }

    async init() {
        await fs.ensureDir(this.outputsDir);
        await fs.ensureDir(this.tempDir);
        console.log(`🚀 Iniciando generación para: ${this.topic} (${this.durationMinutes} min)`);
    }

    /**
     * Genera el guion usando Gemini 1.5 Flash
     */
    async generateScript() {
        console.log("📝 Generando guion con Gemini 2.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Eres un productor experto de documentales cinematicos para YouTube. 
            Escribe un guion completo para un video de ${this.durationMinutes} minutos sobre el tema: "${this.topic}".
            
            El guion debe tener:
            1. Introducción impactante.
            2. Desarrollo dividido en secciones temáticas (al menos 5).
            3. Conclusión reflexiva.
            
            IMPORTANTE PARA LAS IMÁGENES:
            - Cada segmento DEBE tener un "visual_prompt" extremadamente descriptivo en INGLÉS.
            - Evita prompts genéricos. Sé específico: describe la iluminación, el ángulo de cámara, el estilo artístico (fotorealista, cinematográfico, pintura al óleo histórica, etc.) y la acción exacta.
            - Asegúrate de que la imagen se relacione DIRECTAMENTE con lo que se narra en ese momento.
            - Ejemplo de buen visual_prompt: "Cinematic close-up of a Roman centurion's dusty helmet in the middle of a sun-drenched desert battlefield, photorealistic, 8k, historical documentary style".

            ESTRUCTURA JSON:
            {
                "title": "Título del documental",
                "segments": [
                    {
                        "narrative": "Texto narrado en español",
                        "visual_prompt": "Specific English description for image generation",
                        "keywords": ["keyword1", "keyword2"]
                    }
                ]
            }
            - Palabra total aproximada: ${this.durationMinutes * 150}.
            - Añade al menos 15-20 segmentos.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Limpiar el texto si Gemini incluye bloques de código markdown
            const jsonStr = text.replace(/```json|```/g, "").trim();
            this.script = JSON.parse(jsonStr);

            await fs.writeJson(path.join(this.baseDir, 'script.json'), this.script, { spaces: 2 });
            console.log(`✅ Guion generado con ${this.script.segments.length} segmentos.`);
            return this.script;
        } catch (error) {
            console.error("❌ Error generando guion:", error);
            throw error;
        }
    }

    /**
     * Genera audio para cada segmento usando Google Cloud TTS
     */
    async generateAudio() {
        console.log("🎙️ Generando narración con Google Cloud TTS...");
        const audioDir = path.join(this.tempDir, 'audio');
        await fs.ensureDir(audioDir);
        const client = getTTSClient();

        for (let i = 0; i < this.script.segments.length; i++) {
            const segment = this.script.segments[i];
            const request = {
                input: { text: segment.narrative },
                voice: { languageCode: 'es-ES', name: 'es-ES-Neural2-F' }, // Cambiado a Neural2 para mayor calidad
                audioConfig: { audioEncoding: 'MP3', pitch: 0, speakingRate: 1.0 },
            };

            let success = false;
            let attempts = 0;
            while (!success && attempts < 3) {
                try {
                    const [response] = await client.synthesizeSpeech(request);
                    const audioFile = path.join(audioDir, `segment_${i}.mp3`);
                    await fs.writeFile(audioFile, response.audioContent, 'binary');
                    segment.audioPath = audioFile;
                    segment.duration = await this.getDuration(audioFile);
                    success = true;
                    process.stdout.write('.');
                } catch (error) {
                    attempts++;
                    if (error.message.includes("DISABLED") || error.message.includes("not been used")) {
                        console.log(`\n⏳ Esperando propagación de API (Intento ${attempts})...`);
                        await new Promise(r => setTimeout(r, 10000)); // Esperar 10s
                    } else {
                        console.error(`\n❌ Error en TTS Segmento ${i}:`, error.message);
                        throw error;
                    }
                }
            }
        }
        console.log("\n✅ Narración completada.");
    }

    async getDuration(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata.format.duration);
            });
        });
    }

    /**
     * Obtiene imágenes para cada segmento
     * Por ahora usaremos Pollinations/Wikimedia como fallback rápido, 
     * escalable a Imagen 3 si el usuario lo desea.
     */
    /**
     * Obtiene múltiples imágenes para cada segmento para mayor dinamismo
     */
    async fetchVisuals() {
        console.log("🖼️ Buscando múltiples visuales para cada segmento...");
        const imageDir = path.join(this.tempDir, 'images');
        await fs.ensureDir(imageDir);

        for (let i = 0; i < this.script.segments.length; i++) {
            const segment = this.script.segments[i];
            segment.imagePaths = [];

            // Dinámico: 1 imagen cada 5.5 seg (mínimo 2)
            const imagesNeeded = Math.max(2, Math.ceil(segment.duration / 5.5));
            const baseKeywords = [...(segment.keywords || []), segment.visual_prompt, this.topic];

            for (let imgIndex = 0; imgIndex < imagesNeeded; imgIndex++) {
                const imgPath = path.join(imageDir, `img_${i}_${imgIndex}.jpg`);
                let success = false;

                // Usar visual_prompt como fuente principal para máxima relevancia
                // El seed y el modelo flux darán la variedad necesaria
                let promptBase = segment.visual_prompt || this.topic;
                let prompt = `${promptBase}, hyper-realistic documentary photography, cinematic lighting, 4k, ${this.topic} context`;

                const cleanPrompt = prompt.substring(0, 250).replace(/[^\w\s,.-]/g, '');
                // Usar image.pollinations.ai con modelo flux para mejor calidad y coherencia
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1280&height=720&nologo=true&model=flux&seed=${this.runId + i + imgIndex}`;

                try {
                    const response = await axios({
                        method: 'get', url, responseType: 'stream', timeout: 20000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    // Validación de contenido
                    if (response.headers['content-type'] && response.headers['content-type'].includes('text')) {
                        throw new Error("Recibido HTML/Texto en lugar de imagen");
                    }
                    // Si es streams, content-length puede no estar, así que validamos al final o confiamos en el fallback si ffmpeg falla.
                    // Pero mejor forzar error si es obvio.

                    const writer = fs.createWriteStream(imgPath);
                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', () => {
                            // Validar tamaño final
                            const stats = fs.statSync(imgPath);
                            if (stats.size < 4000) {
                                reject(new Error("Imagen demasiado pequeña (posible error)"));
                            } else {
                                resolve();
                            }
                        });
                        writer.on('error', reject);
                    });

                    segment.imagePaths.push(imgPath);
                    success = true;
                    process.stdout.write('*');
                } catch (e) {
                    process.stdout.write('!');
                    // Si falló y se creó un archivo corrupto, borrarlo
                    if (fs.existsSync(imgPath)) {
                        try {
                            if (fs.statSync(imgPath).size < 4000) fs.unlinkSync(imgPath);
                        } catch (delErr) { }
                    }
                }

                if (!success) {
                    // Fallback a Picsum
                    try {
                        const fallbackUrl = `https://picsum.photos/1280/720?random=${this.runId + i + imgIndex}`;
                        const response = await axios({ method: 'get', url: fallbackUrl, responseType: 'stream', timeout: 10000 });
                        const writer = fs.createWriteStream(imgPath);
                        response.data.pipe(writer);
                        await new Promise((resolve) => writer.on('finish', resolve));
                        segment.imagePaths.push(imgPath);
                        process.stdout.write('P');
                    } catch (e) {
                        process.stdout.write('X');
                    }
                }
            }
        }
        console.log("\n✅ Visuales procesados.");
    }

    /**
     * Ensambla el video final con múltiples imágenes y efectos Ken Burns
     */
    async assembleVideo() {
        console.log("🎬 Ensamblando video final con sincronización exacta...");

        // Sanitizar nombre del archivo
        const sanitizedTopic = this.topic.toLowerCase().replace(/[^\w]/g, '_').substring(0, 25);
        const fileName = `documental_${sanitizedTopic}_${Date.now()}.mp4`;
        const outputVideo = path.join(this.outputsDir, fileName);

        const listPath = path.join(this.tempDir, 'concat_list.txt');
        const segmentVideos = [];

        for (let i = 0; i < this.script.segments.length; i++) {
            const seg = this.script.segments[i];
            if (!seg.imagePaths || seg.imagePaths.length === 0 || !seg.audioPath) continue;

            const segVideo = path.join(this.tempDir, `seg_${i}.mp4`);
            const transitionDuration = 0.8;
            const N = seg.imagePaths.length;

            // FÓRMULA DE COMPENSACIÓN:
            // imgDuration = (TotalDuration + (N-1)*TransitionDuration) / N
            let currentTransitionDuration = 0.8;

            // Safety check: Si el segmento es muy corto, reducir la transición o el número de imágenes
            if (seg.duration < (currentTransitionDuration * 1.5)) {
                console.log(`⚠️ Segmento ${i} muy corto (${seg.duration}s). Ajustando transición.`);
                currentTransitionDuration = seg.duration / 3; // Reducir transición drásticamente
                if (currentTransitionDuration < 0.1) currentTransitionDuration = 0; // Sin transición si es muy corto
            }

            const imgDuration = (seg.duration + (N - 1) * currentTransitionDuration) / N;

            console.log(`   Procesando Segmento ${i}: ${seg.duration}s, ${N} imgs, Transición: ${currentTransitionDuration}s, ImgDur: ${imgDuration}s`);

            let command = ffmpeg();
            seg.imagePaths.forEach(imgPath => {
                command = command.input(imgPath).inputOptions(['-loop 1', `-t ${imgDuration}`]);
            });
            command = command.input(seg.audioPath);

            let filterChain = "";
            let vNodes = "";

            // Aplicar escalado inicial a todas las imágenes
            seg.imagePaths.forEach((_, idx) => {
                filterChain += `[${idx}:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1[s${idx}];`;
            });

            // Encadenar xfade entre imágenes
            // La lógica de xfade es: [a][b]xfade=transition=fade:duration=d:offset=o
            let lastNode = "s0";
            let currentOffset = imgDuration - currentTransitionDuration;

            for (let idx = 1; idx < N; idx++) {
                const outNode = `xf${idx}`;
                filterChain += `[${lastNode}][s${idx}]xfade=transition=fade:duration=${currentTransitionDuration}:offset=${currentOffset}[${outNode}];`;
                lastNode = outNode;
                currentOffset += imgDuration - currentTransitionDuration;
            }

            filterChain += `[${lastNode}]setsar=1[vout]`;

            await new Promise((resolve) => {
                command
                    .complexFilter(filterChain)
                    .outputOptions([
                        '-map [vout]',
                        `-map ${N}:a`,
                        '-c:v libx264',
                        '-pix_fmt yuv420p',
                        '-shortest',
                        '-r 25'
                    ])
                    .save(segVideo)
                    .on('end', resolve)
                    .on('error', (err) => {
                        console.error(`\n❌ Error en segmento ${i}:`, err.message);
                        resolve();
                    });
            });

            if (fs.existsSync(segVideo)) {
                segmentVideos.push(segVideo);
                process.stdout.write('|');
            }
        }

        if (segmentVideos.length === 0) {
            throw new Error("No se pudieron generar segmentos de video (posible fallo en audio o imágenes).");
        }

        // Concatenar todos
        const listContent = segmentVideos.map(v => `file '${v.replace(/\\/g, '/')}'`).join('\n');
        await fs.writeFile(listPath, listContent);

        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(listPath)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions(['-c copy'])
                .on('start', (cmd) => console.log(`[FFMPEG] Ejecutando: ${cmd}`))
                .save(outputVideo)
                .on('end', () => {
                    console.log(`\n\n🎉 VIDEO COMPLETADO: ${outputVideo}`);
                    resolve(outputVideo);
                })
                .on('error', (err) => {
                    console.error("FFMPEG Error:", err.message);
                    reject(err);
                });
        });
    }

    async run() {
        try {
            await this.init();
            await this.generateScript();
            await this.generateAudio();
            await this.fetchVisuals();
            await this.assembleVideo();
        } catch (error) {
            console.error("💥 Error fatal en el proceso:", error);
        }
    }
}

// CLI entry point
if (require.main === module) {
    const topic = process.argv[2] || "La historia de la humanidad";
    const duration = parseInt(process.argv[3]) || 10;
    const generator = new VideoGenerator(topic, duration);
    generator.run();
}

module.exports = VideoGenerator;
