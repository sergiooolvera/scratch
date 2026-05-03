const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY'], {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

async function run() {
    console.log("Checking ie_profiles count...");
    const { data, count, error } = await supabase.from('ie_profiles').select('*', { count: 'exact', head: true });
    if (error) {
        console.error("Error ie_profiles:", error);
    } else {
        console.log("Total users in ie_profiles:", count);
    }

    console.log("Checking auth.users count (if admin API is enabled)...");
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error("Error auth.users:", userError);
    } else if (userData && userData.users) {
        console.log("Total users in auth:", userData.users.length);
    }
}
run();
