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

async function checkProfiles() {
    const { data, error } = await supabase.from('ie_profiles').select('*').limit(5);
    console.log("ie_profiles error:", error);
    console.log("ie_profiles data:", data);

    const { data: d2, error: e2 } = await supabase.from('profiles').select('*').limit(5);
    console.log("profiles error:", e2);
    console.log("profiles data:", d2);
}

checkProfiles();
