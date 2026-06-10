const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: profile } = await supabase
    .from('ie_profiles')
    .select('*')
    .eq('id', 'f160fe4d-5461-44c5-b868-51f1f0cae4c2')
    .single();
    
  console.log(profile);
}

main();
