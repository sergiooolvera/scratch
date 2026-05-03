
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auditCompras() {
    console.log('Iniciando auditoría de ie_compras...');

    // 1. Obtener todas las compras en BD
    const { data: compras } = await supabase.from('ie_compras').select('*');
    
    // 2. Obtener todos los pagos manuales aprobados
    const { data: manuales } = await supabase.from('ie_pagos_manuales').select('*').eq('estado', 'aprobado');
    const manualesSet = new Set(manuales.map(m => `${m.user_id}_${m.curso_id}`));

    // 3. Obtener sesiones de Stripe (ultimas 100 para ahorrar tiempo, o todas si es necesario)
    const sessions = await stripe.checkout.sessions.list({ limit: 100, status: 'complete' });
    const stripeSet = new Set();
    sessions.data.forEach(s => {
        if (s.payment_status === 'paid' && s.metadata.user_id && s.metadata.curso_id) {
            stripeSet.add(`${s.metadata.user_id}_${s.metadata.curso_id}`);
        }
    });

    // 4. Mapear usuarios y cursos para legibilidad
    const { data: profiles } = await supabase.from('ie_profiles').select('id, nombre, apellido_paterno');
    const { data: cursos } = await supabase.from('ie_cursos').select('id, titulo');
    const profileMap = {};
    profiles.forEach(p => profileMap[p.id] = `${p.nombre || ''} ${p.apellido_paterno || ''}`.trim());
    const cursoMap = {};
    cursos.forEach(c => cursoMap[c.id] = c.titulo);

    // 5. Categorizar
    const seQuedan = [];
    const seVan = [];

    compras.forEach(c => {
        const key = `${c.user_id}_${c.curso_id}`;
        let razon = '';

        if (stripeSet.has(key)) razon = 'Pago Stripe detectado';
        else if (manualesSet.has(key)) razon = 'Pago Manual Aprobado detectado';
        else if (c.monto_pagado === 0) razon = 'Cupón 100% o Cortesia';
        // Especiales de la imagen (por si acaso el key no bastara)
        else if (key.includes('9335fd08-b2d5-4947-948d-17edf4751e0b') || key.includes('948d')) {
             // Sergio, Jahir, Esmeralda... si están en manualesSet ya entraron arriba.
        }

        const info = {
            id: c.id,
            usuario: profileMap[c.user_id] || 'Desconocido',
            curso: cursoMap[c.curso_id] || 'Desconocido',
            fecha: c.fecha_compra,
            monto: c.monto_pagado
        };

        if (razon) {
            seQuedan.push({ ...info, razon });
        } else {
            seVan.push(info);
        }
    });

    console.log('\n✅ COMPRAS QUE SE QUEDAN:', seQuedan.length);
    console.log('\n❌ COMPRAS CANDIDATAS A BORRAR:', seVan.length);
    seVan.forEach(v => {
        console.log(`- [BORRAR] ${v.usuario} | ${v.curso} | ${v.fecha} | $${v.monto}`);
    });
}

auditCompras();
