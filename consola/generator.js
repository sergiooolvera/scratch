// Wikipedia package removed in favor of axios
const googleTTS = require('google-tts-api');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Set FFmpeg path
const ffmpegPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\consola\\ffmpeg_dist\\bin\\ffmpeg.exe';
console.log(`Usando FFmpeg en: ${ffmpegPath}`);
ffmpeg.setFfmpegPath(ffmpegPath);

async function getWikiContent(topic) {
    console.log(`Búscando contenido completo sobre: ${topic}...`);
    try {
        // Fetch full text version
        const url = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(topic)}&format=json&origin=*`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'ConsolaVideoGen/1.0' }
        });
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const content = pages[pageId].extract;

        if (!content) throw new Error("No se encontró contenido.");

        // Limit to ~5000 chars for now (about 5-7 mins) to avoid excessive processing in demo
        return content.substring(0, 5000);
    } catch (error) {
        console.error('Error en Wikipedia (Full):', error.message);
        return null;
    }
}

async function getAudioDuration(filePath) {
    const ffprobePath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\consola\\ffmpeg_dist\\bin\\ffprobe.exe';
    return new Promise((resolve, reject) => {
        const cp = require('child_process');
        cp.exec(`"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (err, stdout) => {
            if (err) reject(err);
            else resolve(parseFloat(stdout));
        });
    });
}

async function generateLongAudio(text, lang = 'es') {
    console.log(`\nGenerando audio para ${text.length} caracteres...`);

    // Split text into smarter chunks (sentences)
    const rawChunks = text.match(/[^.!?\s][^.!?]*[.!?\s]*/g) || [text];
    const processedChunks = [];
    let current = "";

    for (let chunk of rawChunks) {
        // If a single sentence is > 200, split it by characters/words
        if (chunk.length >= 200) {
            const words = chunk.split(' ');
            for (const word of words) {
                if ((current + " " + word).length < 200) {
                    current += (current ? " " : "") + word;
                } else {
                    if (current) processedChunks.push(current);
                    current = word;
                }
            }
        } else if ((current + chunk).length < 200) {
            current += chunk;
        } else {
            if (current) processedChunks.push(current);
            current = chunk;
        }
    }
    if (current.trim()) processedChunks.push(current.trim());

    const outputDir = path.join(__dirname, 'output', 'parts');
    await fs.ensureDir(outputDir);
    await fs.emptyDir(outputDir);

    const segments = [];
    for (let i = 0; i < processedChunks.length; i++) {
        const url = googleTTS.getAudioUrl(processedChunks[i], {
            lang, slow: false, host: 'https://translate.google.com'
        });
        const partPath = path.join(outputDir, `part_${i}.mp3`);

        const response = await axios({ method: 'get', url, responseType: 'stream' });
        const writer = fs.createWriteStream(partPath);
        response.data.pipe(writer);
        await new Promise((resolve) => writer.on('finish', resolve));

        const duration = await getAudioDuration(partPath);
        console.log(`[DEBUG] Segmento ${i} - Duración: ${duration}`);
        segments.push({ path: partPath, duration, text: processedChunks[i] });
        process.stdout.write('.');
    }

    const finalAudioPath = path.join(__dirname, 'output', 'full_narration.mp3');
    const listPath = path.join(outputDir, 'list.txt');
    const listContent = segments.map(s => `file '${s.path.replace(/\\/g, '/')}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(listPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy'])
            .save(finalAudioPath)
            .on('end', resolve)
            .on('error', reject);
    });

    return { finalAudioPath, segments };
}

async function getWikimediaImage(keyword, topic) {
    const searchTerms = [];
    if (keyword && keyword.trim().length > 3) {
        searchTerms.push(`${topic} ${keyword}`);
        searchTerms.push(keyword);
    }
    searchTerms.push(topic);
    searchTerms.push(`${topic} history`);
    searchTerms.push(`${topic} documentado`);

    const headers = { 'User-Agent': 'ConsolaVideoGen/1.0 (contact: sergi@example.com)' };

    for (const query of searchTerms) {
        try {
            const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query.trim())}&srnamespace=6&format=json&origin=*&srlimit=40`;
            const searchRes = await axios.get(searchUrl, { timeout: 10000, headers });
            const results = searchRes.data.query.search;

            if (results && results.length > 0) {
                // Try up to 8 random results from the search
                for (let attempt = 0; attempt < 8; attempt++) {
                    const title = results[Math.floor(Math.random() * results.length)].title;
                    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
                    const infoRes = await axios.get(infoUrl, { timeout: 10000, headers });
                    const pages = infoRes.data.query.pages;
                    const pageId = Object.keys(pages)[0];
                    if (pages[pageId] && pages[pageId].imageinfo) {
                        const url = pages[pageId].imageinfo[0].url;
                        const lowerUrl = url.toLowerCase();
                        // Ensure it's a real image and not common placeholders
                        if (lowerUrl.match(/\.(jpg|jpeg|png)$/) && !lowerUrl.includes('placeholder') && !lowerUrl.includes('missing')) {
                            return url;
                        }
                    }
                }
            }
        } catch (e) { }
    }
    // Final absolute fallback based on topic or generic
    return `https://images.pollinations.ai/prompt/${encodeURIComponent(topic)}?width=1280&height=720&nologo=true&seed=42`;
}

function extractKeywords(text, topic) {
    const stopWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 'por', 'para', 'con', 'que', 'en', 'de', 'del', 'al', 'fue', 'eran', 'historia', 'mundo', 'naciones', 'potencias', 'durante', 'sobre', 'entre', 'también']);
    const words = text.toLowerCase()
        .replace(/[^\w\sáéíóúñ]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 5 && !stopWords.has(word));

    return words[0] || "";
}

async function assembleVideoDynamic(audioPath, segments, topic, outputPath) {
    const runId = Date.now();
    console.log(`\nEnsamblando documental (ID: ${runId})...`);
    const imagesDir = path.join(__dirname, 'output', `images_${runId}`);
    const tempDir = path.join(__dirname, 'output', `temp_${runId}`);
    await fs.ensureDir(imagesDir);
    await fs.ensureDir(tempDir);

    const sceneVideos = [];

    for (let i = 0; i < segments.length; i++) {
        const searchWord = extractKeywords(segments[i].text, topic);
        console.log(`\nSegmento ${i}/${segments.length}: [${searchWord}]`);

        const validImages = [];
        const imgsPerSegment = 2;

        for (let j = 0; j < imgsPerSegment; j++) {
            const imgPath = path.join(imagesDir, `img_${i}_${j}.jpg`);
            const url = await getWikimediaImage(searchWord, topic);

            if (url) {
                try {
                    const response = await axios({
                        method: 'get', url, responseType: 'stream', timeout: 15000,
                        headers: { 'User-Agent': 'ConsolaVideoGen/1.0' }
                    });
                    const writer = fs.createWriteStream(imgPath);
                    response.data.pipe(writer);
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    // Verification: Magic Numbers
                    const buffer = await fs.readFile(imgPath).catch(() => null);
                    if (buffer && buffer.length > 5000 && (buffer[0] === 0xFF || buffer[0] === 0x89)) {
                        validImages.push(imgPath);
                        process.stdout.write('*');
                    } else {
                        await fs.remove(imgPath);
                        process.stdout.write('!');
                    }
                } catch (e) {
                    process.stdout.write('!');
                }
            }
            await new Promise(r => setTimeout(r, 600));
        }

        // If still no images, use one guaranteed fallback
        if (validImages.length === 0) {
            const imgPath = path.join(imagesDir, `img_${i}_fallback.jpg`);
            // Try multiple fallback sources
            const fallbackUrls = [
                `https://images.pollinations.ai/prompt/${encodeURIComponent(topic + ' documentary visual representative photography')}?width=1280&height=720&nologo=true&seed=${i}`,
                "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Bundesarchiv_Bild_146-1971-033-21%2C_Polen%2C_grenze-Durchbruch.jpg/1280px-thumbnail.jpg", // Classic historical
                "https://picsum.photos/1280/720" // Last resort random
            ];

            let fallbackSuccess = false;
            for (const url of fallbackUrls) {
                try {
                    const response = await axios({ method: 'get', url, responseType: 'stream', timeout: 30000, headers: { 'User-Agent': 'ConsolaVideoGen/1.0' } });
                    const writer = fs.createWriteStream(imgPath);
                    response.data.pipe(writer);
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
                    validImages.push(imgPath);
                    process.stdout.write('F');
                    fallbackSuccess = true;
                    break;
                } catch (e) {
                    process.stdout.write('x');
                }
            }

            if (!fallbackSuccess) {
                console.error(`\n[CRITICAL FAILURE] Segmento ${i} sin imágenes tras múltiples intentos.`);
                continue;
            }
        }

        const segmentVideoPath = path.join(tempDir, `segment_${i}.mp4`);
        const subDuration = segments[i].duration / validImages.length;
        const segmentListPath = path.join(tempDir, `list_img_${i}.txt`);
        const listContent = validImages.map(img => `file '${img.replace(/\\/g, '/')}'\nduration ${subDuration}`).join('\n') + `\nfile '${validImages[validImages.length - 1].replace(/\\/g, '/')}'`;
        await fs.writeFile(segmentListPath, listContent);

        await new Promise((resolve) => {
            ffmpeg()
                .input(segmentListPath)
                .inputOptions(['-f concat', '-safe 0'])
                .input(segments[i].path)
                .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-preset ultrafast', '-vf scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1', '-shortest'])
                .on('start', (c) => console.log(`[FFMPEG] Seg ${i}`))
                .save(segmentVideoPath)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error(`\n[ERR Seg ${i}]`, err.message);
                    resolve();
                });
        });
        if (fs.existsSync(segmentVideoPath)) sceneVideos.push(segmentVideoPath);
    }

    console.log('\n--- Uniendo segmentos finales ---');
    const listPath = path.join(tempDir, 'list.txt');
    const listContent = sceneVideos.map(s => `file '${s.replace(/\\/g, '/')}'`).join('\n');
    await fs.writeFile(listPath, listContent);

    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(listPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy'])
            .on('start', (c) => console.log(`[FFMPEG FINAL CMD] ${c}`))
            .save(outputPath)
            .on('end', resolve)
            .on('error', (err) => {
                console.error('[FFMPEG ERR FINAL]', err.message);
                reject(err);
            });
    });

    // Cleanup
    await fs.remove(imagesDir).catch(() => { });
    await fs.remove(tempDir).catch(() => { });
    return outputPath;
}

async function downloadImages(topic, count = 5) {
    console.log(`Descargando ${count} imágenes para el documental...`);
    const outputDir = path.join(__dirname, 'output', 'images');
    await fs.ensureDir(outputDir);
    await fs.emptyDir(outputDir);

    const imagePaths = [];
    for (let i = 0; i < count; i++) {
        const imgPath = path.join(outputDir, `img_${i}.jpg`);
        // Using dynamic IDs to get different images
        const url = `https://picsum.photos/1280/720?random=${i}`;
        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream',
                timeout: 5000
            });
            const writer = fs.createWriteStream(imgPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            imagePaths.push(imgPath);
            process.stdout.write('*');
        } catch (e) {
            console.error(`\nError imagen ${i}: ${e.message}`);
        }
    }
    console.log('\nImágenes listas.');
    return imagePaths;
}

async function assembleVideoFull(audioPath, imagePaths, outputPath) {
    console.log('Ensamblando video final con múltiples imágenes...');

    return new Promise((resolve, reject) => {
        let command = ffmpeg();

        // Loop through images and add them with a certain duration
        // Simplified: just use the first image for the whole video for now to ensure stability
        // or join images in a sequence. 
        // For a true 20 min video, rotating images is better.
        // We can use the 'concat' demuxer for images too.

        command
            .input(imagePaths[0]) // Use first image as base
            .loop()
            .input(audioPath)
            .outputOptions([
                '-c:v libx264',
                '-tune stillimage',
                '-c:a aac',
                '-b:a 192k',
                '-pix_fmt yuv420p',
                '-shortest'
            ])
            .save(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject);
    });
}

module.exports = { getWikiContent, generateLongAudio, assembleVideoDynamic, downloadImages, assembleVideoFull };
