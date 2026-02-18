const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

const ffmpegPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\consola\\ffmpeg_dist\\bin\\ffmpeg.exe';
ffmpeg.setFfmpegPath(ffmpegPath);

async function test() {
    const audioPath = path.join(__dirname, 'output', 'parts', 'part_0.mp3');
    const img1 = path.join(__dirname, 'output', 'test_img1.jpg');
    const img2 = path.join(__dirname, 'output', 'test_img2.jpg');
    const outputPath = path.join(__dirname, 'output', 'test_segment.mp4');

    // Create dummy images if they don't exist
    // Actually, I'll download them for real to test the full pipeline
    const axios = require('axios');
    const download = async (url, dest) => {
        const response = await axios({ method: 'get', url, responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(dest));
        return new Promise((resolve, reject) => {
            response.data.on('end', resolve);
            response.data.on('error', reject);
        });
    };

    console.log("Downloading test images...");
    await download('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Deep_Blue.jpg/1280px-Deep_Blue.jpg', img1);
    await download('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Kasparov_Magnum_Photos.jpg/1280px-Kasparov_Magnum_Photos.jpg', img2);

    console.log("Rendering segment...");
    const validImages = [img1, img2];
    const duration = 5; // seconds
    const subDuration = duration / validImages.length;

    let cmd = ffmpeg();
    validImages.forEach(img => cmd.input(img).loop(subDuration));
    cmd.input(audioPath);

    const filterItems = validImages.map((_, idx) => `[${idx}:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1[v${idx}]`).join(';');
    const concatItems = validImages.map((_, idx) => `[v${idx}]`).join('');
    const complexFilter = `${filterItems};${concatItems}concat=n=${validImages.length}:v=1:a=0[outv]`;

    cmd
        .complexFilter(complexFilter)
        .outputOptions(['-map [outv]', `-map ${validImages.length}:a`, '-c:v libx264', '-pix_fmt yuv420p', '-preset ultrafast', '-shortest'])
        .on('start', (c) => console.log(`CMD: ${c}`))
        .on('end', () => console.log('Success!'))
        .on('error', (err) => console.error('Error:', err.message))
        .save(outputPath);
}
test();
