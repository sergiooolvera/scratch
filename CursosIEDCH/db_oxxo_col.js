const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.rpc('pg_execute', {
    query: "ALTER TABLE ie_pagos_manuales ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'transferencia';"
  });

  if (error) {
    if (error.message.includes('function "pg_execute" does not exist')) {
        console.log('No pg_execute found, writing SQL file instead...');
        const fs = require('fs');
        fs.writeFileSync('agregar_metodo_pago_manuales.sql', "ALTER TABLE ie_pagos_manuales ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'transferencia';");
    } else {
        console.error(error);
    }
  } else {
    console.log('Success:', data);
  }
}

run();
