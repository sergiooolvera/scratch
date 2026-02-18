const axios = require('axios');
const fs = require('fs');

async function testUrl(name, url) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);
    try {
        const response = await axios({
            method: 'get', url, responseType: 'arraybuffer', timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const contentType = response.headers['content-type'];
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${contentType}`);
        console.log(`Size: ${response.data.length} bytes`);

        if (contentType && contentType.includes('image')) {
            fs.writeFileSync(`${name}.jpg`, response.data);
            console.log("✅ SUCCESS: Saved image.");
        } else {
            console.log("❌ FAIL: Not an image (likely HTML/JSON).");
            // console.log("Preview:", response.data.toString().substring(0, 100));
        }
    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

async function run() {
    const prompt = "cellphone history 1980s brick phone";

    // 1. Original attempt
    await testUrl('test_original', `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);

    // 2. Gen subdomain (current implementation)
    await testUrl('test_gen', `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`);

    // 3. Pollinations.ai/p/
    await testUrl('test_p', `https://pollinations.ai/p/${encodeURIComponent(prompt)}`);

    // 4. Flux model explicit
    await testUrl('test_flux', `https://pollinations.ai/p/${encodeURIComponent(prompt)}?model=flux`);

    // 5. Gen with flux
    await testUrl('test_gen_flux', `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux`);
}

run();
