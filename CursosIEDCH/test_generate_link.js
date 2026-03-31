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

const supabaseAdmin = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL'],
    envVars['SUPABASE_SERVICE_ROLE_KEY']  || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']
);

async function testLink() {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: 'sergio.olver@gmail.com', // use an existing user email
    });
    console.log("Link data:", data);
    console.log("Error:", error);
}

testLink();
