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
    const { data } = await supabase.from('ie_cupones').select('*');
    console.log(data);
    
    // Also let's check how many old purchases have pago_completo = true vs false
    const { data: c1 } = await supabase.from('ie_compras').select('*').eq('pago_completo', false);
    const { data: c2 } = await supabase.from('ie_compras').select('*').eq('pago_completo', true);
    console.log(`False: ${c1 ? c1.length : 0}, True: ${c2 ? c2.length : 0}`);
}
run();
