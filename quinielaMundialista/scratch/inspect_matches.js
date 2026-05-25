const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error, count } = await supabase
    .from('qui_matches')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching matches:', error);
    return;
  }

  console.log('Total matches in database:', count);
  console.log('Matches sample:', data.slice(0, 3));
}

main();
