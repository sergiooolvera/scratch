const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = 'C:\\Users\\sergi\\.gemini\\antigravity\\scratch\\consola\\ffmpeg_dist\\bin\\ffmpeg.exe';
ffmpeg.setFfmpegPath(ffmpegPath);

ffmpeg()
    .input('output/images/img_0_0.jpg')
    .loop(2)
    .fps(25)
    .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'])
    .save('test_ffmpeg.mp4')
    .on('end', () => console.log('Success'))
    .on('error', (err) => console.log('Error:', err.message));
