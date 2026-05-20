const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('ie_examenes')
    .delete()
    .eq('id', 'a69c5c6a-ab5a-4403-8c76-ef9fe7f33db5');
  if (error) console.error(error);
  else console.log("Deleted duplicate exam successfully.");
}

run();
