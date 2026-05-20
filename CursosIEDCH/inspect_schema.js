const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- ie_curso_modulos Columns info ---');
  const { data: cols, error: err1 } = await supabase.rpc('get_table_columns', { t_name: 'ie_curso_modulos' });
  if (err1) {
    // If no RPC, let's query all records or inspect the table via query
    const { data: records, error: err2 } = await supabase.from('ie_curso_modulos').select('*').limit(10);
    console.log('Records count:', records?.length);
    console.log('Record sample:', records?.[0]);
  } else {
    console.log('Columns detailed:', cols);
  }

  console.log('--- ie_preguntas Columns info ---');
  const { data: pregs, error: err3 } = await supabase.from('ie_preguntas').select('*').limit(1);
  console.log('Preguntas sample:', pregs?.[0]);
}

inspect();
