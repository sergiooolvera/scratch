require('dotenv').config({ path: '.env.local' });

console.log("Keys in .env.local:");
Object.keys(process.env).forEach(key => {
  if (key.includes('SUPABASE') || key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('URL') || key.includes('KEY')) {
    console.log(`- ${key}: ${process.env[key] ? 'DEFINED' : 'UNDEFINED'}`);
  }
});
