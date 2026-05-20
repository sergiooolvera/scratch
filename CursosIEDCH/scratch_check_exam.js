require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const { data: examen, error } = await supabase
        .from('ie_examenes')
        .select('*')
        .eq('curso_id', '5deee6df-f7ed-4a01-b137-499794402b0c')
        .single();
        
    if (error) {
        console.error('Error al buscar el examen:', error);
    } else {
        console.log('Configuración actual del examen:');
        console.log('Intentos permitidos:', examen.intentos_permitidos);
        console.log('Min. aprobación:', examen.min_aprobacion);
        console.log('Tiempo límite:', examen.tiempo_limite);
        console.log('Seguridad aumentada:', examen.seguridad_aumentada);
    }
}

run();
