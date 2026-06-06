const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTrigger() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Fetching handle_new_user function definition...');
  const { data, error } = await supabase.rpc('inspect_function', { name: 'handle_new_user' });
  
  if (error) {
    // Let's run a raw SQL query if we can, or fetch schema information
    console.error('Error fetching via RPC:', error.message);
    
    // We can execute SQL by calling check_db api or similar, but let's check with a sql client or by writing a query
    // Let's try running a direct query through postgres if possible, or check if we have a table inspect script
  } else {
    console.log('Definition:', data);
  }
  
  // Let's do a direct query to get the function body using pg_catalog
  const { data: triggerInfo, error: triggerError } = await supabase
    .from('ie_profiles') // we can't query pg_proc directly unless we have an RPC
    .select('*')
    .limit(1);
    
  console.log('Trigger/RPC not directly queryable without RPC helper. Let\'s check.');
}

checkTrigger();
