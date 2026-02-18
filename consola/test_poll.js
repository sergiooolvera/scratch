const axios = require('axios');
const fs = require('fs-extra');

async function test() {
    const url = "https://image.pollinations.ai/prompt/Segunda%20Guerra%20Mundial%2C%20cinematic%20historical%20photography?width=1280&height=720&nologo=true&seed=123";
    try {
        console.log("Downloading...");
        const response = await axios({ method: 'get', url, responseType: 'arraybuffer', timeout: 30000 });
        console.log("Status:", response.status);
        console.log("Length:", response.data.length);
        console.log("First bytes:", response.data.slice(0, 4).toString('hex'));
        await fs.writeFile('test_poll.jpg', response.data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
