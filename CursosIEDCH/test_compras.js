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

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompras() {
    const { data: comprasData, error } = await supabase
        .from('ie_compras')
        .select('*')
        .limit(1);
    console.log("Compras Data:", comprasData);
}

checkCompras();
