const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

const commonTables = [
  'profiles',
  'users',
  'pl_profiles',
  'pl_users',
  'customers',
  'orders',
  'products',
  'qui_profiles',
  'qui_matches',
  'qui_predictions',
  'qui_payments',
  'qui_system_settings',
  'qui_notifications'
];

async function checkTables() {
  for (const table of commonTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`✅ Table exists: ${table} (${data.length} rows fetched or empty)`);
    } else {
      if (error.message.includes('does not exist')) {
        // Table doesn't exist
      } else {
        console.log(`⚠️ Table ${table} returned error:`, error.message);
      }
    }
  }
}

checkTables();
