const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- ie_modulo_recursos ---');
  const { data: recs, error: err1 } = await supabase.from('ie_modulo_recursos').select('*').limit(1);
  if (err1) {
      console.log('Error/Does not exist:', err1.message);
  } else {
      console.log('Table ie_modulo_recursos exists!');
      console.log('Columns:', Object.keys(recs?.[0] || {}));
  }

  console.log('--- ie_preguntas ---');
  const { data: pregs, error: err2 } = await supabase.from('ie_preguntas').select('*').limit(1);
  if (err2) console.error(err2);
  else console.log('Preguntas columns:', Object.keys(pregs?.[0] || {}));
}

inspect();

