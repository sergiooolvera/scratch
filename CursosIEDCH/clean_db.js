
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanDB() {
    console.log('Iniciando limpieza profunda (v2)...');

    // 1. IDs que SE QUEDAN (de la imagen de transferencias)
    const keepManualIds = [
        '4a32ae4c-c640-491a-8ebb-ddbab7eb6cba', // Sergio - Diálisis
        'a59f501d-c964-4e2c-9203-a0d8b85d8324', // Sergio - MATEMATICAS (May)
        '4f2d421a-89cf-4c45-af26-1b8d709c524f', // Jahir - Fundamentos
        '40310d54-4595-4f85-958f-6eeb2c851a13', // Esmeralda - Fundamentos
        '29ef1025-0bda-43a1-b95a-9f7340186f61'  // Sergio - MATEMATICAS (Mar)
    ];

    // 2. Obtener sesiones de Stripe reales para protección
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const stripeSales = new Set(sessions.data
        .filter(s => s.payment_status === 'paid' && s.metadata.user_id)
        .map(s => `${s.metadata.user_id}_${s.metadata.curso_id}`)
    );

    // 3. Obtener los manuales a borrar
    const { data: manualesAll } = await supabase.from('ie_pagos_manuales').select('*').eq('estado', 'aprobado');
    const toDelete = manualesAll.filter(m => !keepManualIds.includes(m.id));

    console.log(`Borrando ${toDelete.length} pagos manuales excedentes...`);

    for (const m of toDelete) {
        const key = `${m.user_id}_${m.curso_id}`;
        
        // Solo borrar de ie_compras si NO es una venta confirmada de Stripe
        if (!stripeSales.has(key)) {
            const { error: errC } = await supabase
                .from('ie_compras')
                .delete()
                .eq('user_id', m.user_id)
                .eq('curso_id', m.curso_id)
                .is('referred_by', null); // Usualmente los manuales excedentes no tienen referido o son duplicados
            
            if (errC) console.error(`Error borrando compra de ${m.user_id}:`, errC);
        }

        // Borrar el pago manual
        const { error: errM } = await supabase.from('ie_pagos_manuales').delete().eq('id', m.id);
        if (errM) console.error(`Error borrando pago manual ${m.id}:`, errM);
    }

    console.log('Limpieza terminada con éxito.');
}

cleanDB();
