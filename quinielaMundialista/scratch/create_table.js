const { createClient } = require('@supabase/supabase-js');

const PROJECT_REF = 'gyyrcilivzqxzgkcgzfe';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

async function tryMgmtAPI() {
  console.log('Trying Supabase Management API...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: 'SELECT 1;' })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.substring(0, 500));
}

async function tryDirect() {
  // Try connecting via Supabase client with service role to check if there's a way
  const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_KEY
  );
  
  // Try to upsert into a new table - this will fail if table doesn't exist
  // but the error will tell us something
  const { data, error } = await supabase.from('qui_promoter_info').select('*').limit(1);
  console.log('Query qui_promoter_info:', error ? error.message : 'Table exists: ' + JSON.stringify(data));
}

async function main() {
  await tryMgmtAPI();
  console.log('---');
  await tryDirect();
}

main();
