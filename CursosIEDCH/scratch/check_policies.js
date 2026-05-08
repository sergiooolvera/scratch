const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkCursosPolicies() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('[DEBUG] Executing pg_catalog select via RPC fallback or raw REST call...');
  
  // We can query pg_policies using custom functions if they are exposed, or try selecting from it.
  // Wait, pg_policies is a view, usually public. So we can check if it can be selected.
  // But wait, PostgREST doesn't expose pg_catalog views by default unless they are in the search path.
  // Wait, let's look at check_db.js's style. Can we check if there are custom functions?
  // Let's list all custom RPCs!
  const { data: rpcs, error: rpcErr } = await supabase.rpc('get_table_columns', { t_name: 'ie_cursos' }).then(res => {
     return res;
  }).catch(e => { return { error: e }; });
  
  console.log('RPC test:', { rpcs, rpcErr });
}

checkCursosPolicies();
