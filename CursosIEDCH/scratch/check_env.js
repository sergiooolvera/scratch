const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env copy.local')) {
  const buf = fs.readFileSync('.env copy.local');
  const config = dotenv.parse(buf);
  console.log('Keys in .env copy.local:', Object.keys(config));
} else {
  console.log('.env copy.local not found');
}
