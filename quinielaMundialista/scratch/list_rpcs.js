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
    
    console.log('--- Paths in REST API ---');
    const paths = Object.keys(spec.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log('Found RPCs:', rpcs);
    
  } catch (e) {
    console.error('Error fetching:', e);
  }
}

main().catch(console.error);
