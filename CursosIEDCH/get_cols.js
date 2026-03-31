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

async function testQuery() {
    console.log("Fetching ie_compras...");
    const { data, error } = await supabase.from("ie_compras").select("*").limit(1);

    if (error) {
        console.error("ERROR:", error);
    } else {
        console.log("DATA:", data);
        if (data && data.length > 0) {
            console.log("COLUMNS:", Object.keys(data[0]));
        } else {
            console.log("No data found.");
        }
    }
}
testQuery();
