require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Iniciando borrado de datos para sergio.olver@gmail.com en MATEMATICAS...');

    // 1. Find course "MATEMATICAS"
    const { data: curso, error: cursoError } = await supabase
        .from('ie_cursos')
        .select('id, titulo')
        .eq('titulo', 'MATEMATICAS')
        .single();

    if (cursoError || !curso) {
        console.error('Error al buscar el curso MATEMATICAS:', cursoError);
        return;
    }
    console.log('Curso encontrado:', curso);

    // 2. Find user in ie_profiles or auth (let's check ie_compras first by email if possible)
    // Let's search in ie_compras where we might find the link or email.
    // Or let's assume we can find the user by listing users in auth.
    
    let userId = null;
    try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const sergio = users?.users.find(u => u.email === 'sergio.olver@gmail.com');
        if (sergio) {
            userId = sergio.id;
            console.log('Usuario encontrado en Auth:', userId);
        }
    } catch (e) {
        console.log('No se pudo usar auth.admin, intentando buscar en compras...');
    }

    if (!userId) {
        // Fallback: buscar en ie_compras (asumiendo que hay registros de él)
        // Pero no sabemos el user_id. Let's assume we can find it by querying ie_compras
        // and hoping we find a record we know is his, or querying all and filtering.
        console.log('Buscando en ie_compras...');
        const { data: todasCompras } = await supabase.from('ie_compras').select('*');
        // Let's find one that looks like him? Or let's query ie_profiles if it has a way.
        // Actually, let's check if ie_profiles has a user_id or id that matches auth.
        // Let's try to search for "sergio" in ie_profiles.
        const { data: profiles } = await supabase.from('ie_profiles').select('id, nombre');
        const sergioProfile = profiles?.find(p => p.nombre?.toLowerCase().includes('sergio'));
        if (sergioProfile) {
            userId = sergioProfile.id;
            console.log('Usuario encontrado por perfil:', userId, sergioProfile.nombre);
        }
    }

    if (!userId) {
        console.error('No se pudo determinar el user_id de Sergio.');
        return;
    }

    // 3. Delete from ie_compras
    const { error: delCompraError } = await supabase
        .from('ie_compras')
        .delete()
        .eq('user_id', userId)
        .eq('curso_id', curso.id);

    if (delCompraError) {
        console.error('Error al borrar compras:', delCompraError);
    } else {
        console.log('Compras borradas con éxito.');
    }

    // 4. Find exam
    const { data: examen } = await supabase
        .from('ie_examenes')
        .select('id')
        .eq('curso_id', curso.id)
        .single();

    if (examen) {
        // Delete from ie_resultados_examenes
        const { error: delResError } = await supabase
            .from('ie_resultados_examenes')
            .delete()
            .eq('user_id', userId)
            .eq('examen_id', examen.id);

        if (delResError) {
            console.error('Error al borrar resultados de examen:', delResError);
        } else {
            console.log('Resultados de examen borrados con éxito.');
        }
    } else {
        console.log('No se encontró examen para este curso.');
    }
}

run();
