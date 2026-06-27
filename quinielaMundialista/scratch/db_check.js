const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUnmatchedUsers() {
  const { data: profiles, error: profError } = await supabase
    .from('qui_profiles')
    .select('id, username');
  
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (profError || authError) {
    console.error(profError || authError);
    return;
  }

  const profileIds = new Set(profiles.map(p => p.id));
  console.log('Auth users with no profiles:');
  const unmatched = [];
  users.forEach(u => {
    if (!profileIds.has(u.id)) {
      console.log(`ID: ${u.id} | Email: ${u.email}`);
      unmatched.push(u);
    }
  });

  if (unmatched.length > 0) {
    const testUser = unmatched[0];
    console.log(`\n--- Attempting manual insert into qui_profiles for ${testUser.email} (${testUser.id}) ---`);
    const { data, error } = await supabase
      .from('qui_profiles')
      .insert({
        id: testUser.id,
        username: 'test_' + testUser.id.substring(0, 8),
        full_name: 'Test Manual Insert',
        referral_code: 'TEST_' + testUser.id.substring(0, 3).toUpperCase()
      });
    
    if (error) {
      console.error('Manual insert failed:', error);
    } else {
      console.log('Manual insert SUCCEEDED!', data);
      // Clean it up
      await supabase.from('qui_profiles').delete().eq('id', testUser.id);
      console.log('Cleaned up profile');
    }
  } else {
    console.log('No unmatched users found. Creating a temporary auth user first...');
    // Create an auth user using a different email, but wait, the auth user creation itself will trigger the function
    // and fail! So we can't create an auth user because the trigger will fail.
  }
}

findUnmatchedUsers();
