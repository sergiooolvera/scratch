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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testCreate(email, username, referralCode) {
  console.log(`\nTesting user creation for ${email}...`);
  try {
    const userMetadata = {};
    if (username) userMetadata.username = username;
    if (username) userMetadata.full_name = 'Test ' + username;
    if (referralCode) userMetadata.referral_code_used = referralCode;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password_test_123',
      email_confirm: true,
      user_metadata: userMetadata
    });
    
    if (error) {
      console.error(`FAILED for ${email}:`, error.message);
    } else {
      console.log(`SUCCESS for ${email}! User:`, data.user.id);
      
      // Clean up
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      if (delError) console.error('DeleteUser failed:', delError.message);
      else console.log('Cleaned up successfully.');
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

async function main() {
  // Test 1: No metadata at all
  await testCreate('test_none@quimundial.test', null, null);

  // Test 2: Username and FullName but no referral code
  await testCreate('test_noref@quimundial.test', 'test_noref_user', null);

  // Test 3: Username, FullName, and invalid referral code
  await testCreate('test_invalidref@quimundial.test', 'test_invalidref_user', 'NONEXISTENT');
}

main().catch(console.error);
