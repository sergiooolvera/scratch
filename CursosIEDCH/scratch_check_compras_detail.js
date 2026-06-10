const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
    const ids = [
        'f672c33a-19b6-4f0b-87de-1e79b2f4155a', // Diana Marlene compra ID
        'b3039280-fa79-4e30-b458-b16b984e9e8e'  // Bethsaida Anai compra ID
    ];

    console.log("=== Querying detailed ie_compras records ===");
    for (const id of ids) {
        const { data, error } = await supabase
            .from('ie_compras')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            console.error(error);
        } else {
            console.log(JSON.stringify(data, null, 2));
            console.log("-----------------------------------------");
        }
    }
}
run();
