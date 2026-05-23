const fs = require('fs');

const envLocalPath = '.env.local';
let supabaseUrl = '';
let supabaseServiceKey = '';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val;
    }
  });
}

async function main() {
  const fullUrl = supabaseUrl + '/rest/v1/';
  try {
    const res = await fetch(fullUrl, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const spec = await res.json();
    
    console.log('--- Columns in qui_profiles ---');
    if (spec.definitions && spec.definitions.qui_profiles) {
      console.log(Object.keys(spec.definitions.qui_profiles.properties));
    } else {
      console.log('qui_profiles definition not found');
    }

    console.log('\n--- Columns in qui_system_settings ---');
    if (spec.definitions && spec.definitions.qui_system_settings) {
      console.log(Object.keys(spec.definitions.qui_system_settings.properties));
    } else {
      console.log('qui_system_settings definition not found');
    }
    
  } catch (e) {
    console.error('Error fetching REST spec:', e);
  }
}

main().catch(console.error);
