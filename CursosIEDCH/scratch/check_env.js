const fs = require('fs');
require('dotenv').config({path: '.env.local'});
console.log('Available keys in .env.local:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('URL') || k.includes('KEY') || k.includes('PASS') || k.includes('DB')));
