const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envFiles = ['.env.production.local', '.env.local', '.env'];
  let env = {};
  for (const file of envFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const index = trimmed.indexOf('=');
        if (index > 0) {
          const key = trimmed.slice(0, index).trim();
          let value = trimmed.slice(index + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!env[key]) {
            env[key] = value;
          }
        }
      }
    }
  }
  return env;
}

async function run() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const userId = '5ce74f03-8c9c-4537-ba05-01e20f76dffc'; // MX User

  console.log('Inserting test notification...');
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('qui_notifications')
    .insert({
      user_id: userId,
      message: 'Test notification ' + Date.now(),
      read: false
    })
    .select();

  if (insertError) {
    console.error('Insert error:', insertError);
    process.exit(1);
  }

  console.log('Inserted:', insertData);
  const newId = insertData[0].id;

  console.log('Testing single delete via Admin...');
  const { error: deleteSingleError } = await supabaseAdmin
    .from('qui_notifications')
    .delete()
    .eq('id', newId)
    .eq('user_id', userId);

  if (deleteSingleError) {
    console.error('Delete single error:', deleteSingleError);
  } else {
    console.log('✅ Delete single success!');
  }

  console.log('Inserting multiple notifications to test clear all...');
  await supabaseAdmin.from('qui_notifications').insert([
    { user_id: userId, message: 'Bulk test 1', read: false },
    { user_id: userId, message: 'Bulk test 2', read: false }
  ]);

  console.log('Testing clear all via Admin...');
  const { error: clearAllError } = await supabaseAdmin
    .from('qui_notifications')
    .delete()
    .eq('user_id', userId);

  if (clearAllError) {
    console.error('Clear all error:', clearAllError);
  } else {
    console.log('✅ Clear all success!');
  }
}

run();
