const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSystemTriggers() {
  console.log('--- Probing triggers ---');
  
  // Try querying common trigger tables / views
  const targets = [
    'pg_trigger',
    'triggers',
    'pg_proc',
    'pg_description'
  ];

  for (const t of targets) {
    const { data, error } = await supabase.from(t).select('*').limit(5);
    if (!error) {
      console.log(`✅ Accessed system catalog table: ${t}`);
      console.log(data);
    } else {
      console.log(`❌ Failed to access ${t}:`, error.message);
    }
  }
}

checkSystemTriggers();
