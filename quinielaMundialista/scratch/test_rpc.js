const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  const possibleFunctions = ['exec_sql', 'run_sql', 'execute_sql', 'exec'];
  
  for (const fn of possibleFunctions) {
    console.log(`Testing RPC function: ${fn}`);
    const { data, error } = await supabase.rpc(fn, { sql: 'SELECT 1;' });
    if (!error) {
      console.log(`✅ Function ${fn} exists and returned:`, data);
      return;
    } else {
      console.log(`❌ Function ${fn} failed:`, error.message);
    }
  }
}

testRpc();
