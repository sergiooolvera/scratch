const { createClient } = require('@supabase/supabase-js');

// Use the exact Anon Key that the browser uses!
const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjMxNTgsImV4cCI6MjA5NDQzOTE1OH0.tNGNDVZiJaz9l-B2DPq8RKJEDMIaeFJ15o_U93fsUWs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing SELECT qui_matches with ANON KEY...');
  const { data, error, count } = await supabase
    .from('qui_matches')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching matches with Anon Key:', error);
    return;
  }

  console.log('Total matches fetched with Anon Key:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('Sample match:', data[0]);
  }
}

main();
