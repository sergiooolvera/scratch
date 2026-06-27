const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('Querying qui_profiles...');
  const { data: profiles, error: profError } = await supabaseAdmin
    .from('qui_profiles')
    .select('*');
  
  if (profError) {
    console.error('Error fetching profiles:', profError);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}, Username: ${p.username}, FullName: ${p.full_name}, Referral: ${p.referral_code}, ReferredBy: ${p.referred_by}`);
    });
  }

  console.log('\nQuerying auth.users...');
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) {
    console.error('Error listing users:', userError);
  } else {
    console.log(`Found ${users.users.length} users in auth:`);
    users.users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata:`, u.raw_user_meta_data);
    });
  }
}

main().catch(console.error);
