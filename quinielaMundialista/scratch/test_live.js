const https = require('https');

const targets = [
  { name: 'Home Page', url: 'https://quimundial.com/' },
  { name: 'Login Page', url: 'https://quimundial.com/login' },
  { name: 'Ranking Page', url: 'https://quimundial.com/ranking' },
  { name: 'Quiniela Page', url: 'https://quimundial.com/quiniela' },
  { name: 'Promotor Page', url: 'https://quimundial.com/promotor' },
  { name: 'Admin Page', url: 'https://quimundial.com/admin' }
];

async function checkUrl(target) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(target.url, { timeout: 8000 }, (res) => {
      const duration = Date.now() - start;
      let data = '';
      res.on('data', (chunk) => {
        if (data.length < 2000) data += chunk;
      });
      res.on('end', () => {
        resolve({
          name: target.name,
          url: target.url,
          status: res.statusCode,
          duration,
          headers: res.headers,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          sample: data.slice(0, 300).replace(/\s+/g, ' ')
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name: target.name,
        url: target.url,
        status: 'ERROR',
        duration: Date.now() - start,
        error: err.message,
        ok: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: target.name,
        url: target.url,
        status: 'TIMEOUT',
        duration: Date.now() - start,
        ok: false
      });
    });
  });
}

async function run() {
  console.log('--- Testing Live Site: https://quimundial.com/ ---');
  const results = [];
  for (const target of targets) {
    console.log(`Checking ${target.name}...`);
    const result = await checkUrl(target);
    results.push(result);
  }
  console.log('\n--- Results ---');
  console.log(JSON.stringify(results, null, 2));
}

run();
