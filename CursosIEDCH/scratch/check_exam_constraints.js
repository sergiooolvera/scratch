const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'ie_examenes' });
  if (error) {
    // Let's try raw pg query via RPC if custom RPC exists, or we query pg_indexes or pg_constraint
    console.log("RPC Error:", error.message);
    
    // We can query pg_catalog using standard Supabase REST API if it has permission,
    // otherwise we can just run a quick migration script to add the column safely.
    const { data: indexes, error: idxError } = await supabase
      .from('pg_catalog.pg_indexes')
      .select('*')
      .eq('tablename', 'ie_examenes');
    if (idxError) {
      console.error("Index fetch error:", idxError.message);
    } else {
      console.log("Indexes on ie_examenes:", indexes);
    }
  } else {
    console.log("Constraints:", data);
  }
}

run();
