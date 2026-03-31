const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\.env.local', 'utf-8');
const lines = envFile.split('\n');
const envVars = {};
lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    }
});
const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

async function testInsert() {
    console.log("Testing insert without pago_completo...");
    const { data, error } = await supabase.from("ie_compras").insert({
        user_id: 'ff75de6e-24ad-409e-a406-3df73e4209cc', // Yareli
        curso_id: '5deee6df-f7ed-4a01-b137-499794402b0c', // Another course to test
        pagado: true
    }).select();

    if (error) {
        console.error("EXPECTED ERROR:", error);
    } else {
        console.log("INSERT WORKED (so pago_completo is not strictly required or has a default):", data);
        // clean up
        await supabase.from("ie_compras").delete().eq('id', data[0].id);
    }
}
testInsert();
