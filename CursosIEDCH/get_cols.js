const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function listColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('[DEBUG] Consultando columnas de ie_pagos_manuales...');
  const { data, error } = await supabase.rpc('get_table_columns', { t_name: 'ie_pagos_manuales' });
  
  if (error) {
    // Fallback si el RPC no existe: usar una query directa
    const { data: cols, error: qErr } = await supabase.from('ie_pagos_manuales').select('*').limit(1);
    if (qErr) return console.error(qErr);
    console.log('Columnas encontradas:', Object.keys(cols?.[0] || {}));
  } else {
    console.log('Columnas:', data);
  }
}

listColumns();
