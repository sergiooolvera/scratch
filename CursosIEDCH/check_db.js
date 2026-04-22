const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('ie_compras').select('id, user_id, curso_id, monto_pagado, pago_completo, ie_profiles(email)').order('fecha_compra', {ascending: false}).limit(5).then(({data, error}) => {
    if(error) console.error(error);
    console.log(JSON.stringify(data, null, 2));
});
