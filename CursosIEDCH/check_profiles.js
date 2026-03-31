const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\.env.local', 'utf-8');
const lines = envFile.split('\n');
const envVars = {};
lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
});
const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
    const { data } = await supabase.from('ie_profiles').select('*').limit(1);
    console.log("Cols:", Object.keys(data[0]));
    console.log("Row:", data[0]);
}
run();
