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

async function fixOldPrices() {
    console.log("Checking ie_compras...");
    const { data: compras, error } = await supabase.from("ie_compras").select("id, pago_completo, monto_pagado");
    
    if (error) {
        console.error("ERROR:", error);
        return;
    }
    
    console.log(`Found ${compras.length} records.`);
    const pagoNoCompleto = compras.filter(c => c.pago_completo === false);
    console.log(`Records with pago_completo = false: ${pagoNoCompleto.length}`);

    // Update old records where pago_completo = false to monto_pagado = 0
    if (pagoNoCompleto.length > 0) {
        // Just checking for now
        console.log("Example:", pagoNoCompleto[0]);
    }
}
fixOldPrices();
