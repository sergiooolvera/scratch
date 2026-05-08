const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function listColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('[DEBUG] Consultando columnas de ie_profiles...');
  const { data: cols, error: qErr } = await supabase.from('ie_profiles').select('*').limit(1);
  if (qErr) return console.error(qErr);
  console.log('Columnas encontradas:', Object.keys(cols?.[0] || {}));
}

listColumns();
