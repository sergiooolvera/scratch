require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Faltan variables de entorno');
    process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
    try {
        console.log('Buscando al usuario sergio...');
        const { data: users, error: eqErr } = await supabase.from('ie_profiles').select('id, nombre, email').ilike('nombre', '%sergio%').limit(1);
        const sergio = users?.[0];
        if(!sergio){
            console.log('Usuario sergio no encontrado');
            return;
        }
        console.log('Encontrado sergio:', sergio.id);

        console.log('Buscando curso de geograf...');
        const { data: cursos, error: crErr } = await supabase.from('ie_cursos').select('id, titulo').ilike('titulo', '%geograf%').limit(1);
        const geo = cursos?.[0];
        if(!geo){
            console.log('Curso de geografia no encontrado');
            return;
        }
        console.log('Encontrado curso:', geo.titulo, geo.id);

        console.log('Borrando datos para probar el nuevo flujo...');

        // 3. Borrar compras (ie_compras)
        const { error: d1 } = await supabase.from('ie_compras').delete().eq('user_id', sergio.id).eq('curso_id', geo.id);
        if(d1) console.log('Error borrando compra:', d1.message); else console.log('✓ Compra borrada.');

        // 4. Borrar examenes_usuario
        const { error: d2 } = await supabase.from('ie_examenes_usuario').delete().eq('user_id', sergio.id).eq('curso_id', geo.id);
        if(d2) console.log('Error borrando examen usuario:', d2.message); else console.log('✓ Examen de usuario borrado.');

        // 5. Borrar resultados examenes
        const { data: examRefs } = await supabase.from('ie_examenes').select('id').eq('curso_id', geo.id);
        if (examRefs && examRefs.length > 0) {
            for (let exam of examRefs) {
                const { error: d2b } = await supabase.from('ie_resultados_examenes').delete().eq('user_id', sergio.id).eq('examen_id', exam.id);
                if(d2b) console.log('Error borrando resultados examenes:', d2b.message);
            }
            console.log('✓ Resultados de exámenes borrados.');
        }

        // 6. Borrar ie_pagos_manuales
        const { error: d3 } = await supabase.from('ie_pagos_manuales').delete().eq('user_id', sergio.id).eq('curso_id', geo.id);
        if(d3) console.log('Error borrando recibo manual:', d3.message); else console.log('✓ Pagos manuales / recibos borrados.');

        console.log('¡Prueba limpia y lista para ser ejecutada!');
    } catch (e) {
        console.error('Error in script:', e);
    } finally {
        process.exit(0);
    }
}

main();
