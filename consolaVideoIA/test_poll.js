const axios = require('axios');
const fs = require('fs');

async function testPollinations() {
    const prompt = "A photorealistic image of the Great Pyramid of Giza under a clear blue sky, hyper-realistic documentary photography, cinematic lighting, high resolution, 4k, La Gran Pirámide documentary detail";
    const cleanPrompt = prompt.substring(0, 250).replace(/[^\w\s,.-]/g, '');
    // Try the main domain with /prompt/ path
    // Try the gen domain
    const url = `https://pollinations.ai/p/${encodeURIComponent(cleanPrompt)}?width=1280&height=720&nologo=true&seed=12345`;

    console.log(`URL: ${url}`);

    try {
        const response = await axios({
            method: 'get', url, responseType: 'stream', timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const writer = fs.createWriteStream('test_poll.jpg');
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Check file size and first bytes
        const stats = fs.statSync('test_poll.jpg');
        console.log(`File size: ${stats.size} bytes`);
        if (stats.size < 5000) {
            const content = fs.readFileSync('test_poll.jpg', 'utf8');
            console.log("File content start:", content.substring(0, 50));
        } else {
            console.log("SUCCESS: Image looks sufficient size.");
        }

    } catch (e) {
        console.error("FAILED:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
        }
    }
}

testPollinations();
