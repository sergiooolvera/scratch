require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Iniciando borrado de datos para sergio.olver@gmail.com en el curso Matemáticas 2...');

    // 1. Find course "Matemáticas 2" or similar
    const { data: cursos, error: cursosError } = await supabase
        .from('ie_cursos')
        .select('id, titulo');

    if (cursosError) {
        console.error('Error al buscar cursos:', cursosError);
        return;
    }

    const curso = cursos.find(c => 
        c.titulo?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "matematicas 2"
    );

    if (!curso) {
        console.error('No se encontró el curso "Matemáticas 2". Cursos disponibles:', cursos.map(c => c.titulo));
        return;
    }
    console.log('Curso encontrado:', curso);

    // 2. Find user in Auth
    let userId = null;
    try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const sergio = users?.users.find(u => u.email === 'sergio.olver@gmail.com');
        if (sergio) {
            userId = sergio.id;
            console.log('Usuario encontrado en Auth:', userId);
        }
    } catch (e) {
        console.log('No se pudo usar auth.admin:', e.message);
    }

    if (!userId) {
        // Fallback: search in ie_profiles
        const { data: profiles } = await supabase.from('ie_profiles').select('id, nombre');
        const sergioProfile = profiles?.find(p => p.nombre?.toLowerCase().includes('sergio') || p.id === 'sergio-uuid'); // or query by email if profile stores it
        if (sergioProfile) {
            userId = sergioProfile.id;
            console.log('Usuario encontrado por perfil:', userId, sergioProfile.nombre);
        }
    }

    if (!userId) {
        // Double check purchases to find a user id if there are records
        const { data: compras } = await supabase.from('ie_compras').select('user_id').eq('curso_id', curso.id);
        console.log('Compras registradas para este curso:', compras);
        console.error('No se pudo determinar el user_id de Sergio.');
        return;
    }

    // 3. Delete from ie_compras
    const { data: deletedCompras, error: delCompraError } = await supabase
        .from('ie_compras')
        .delete()
        .eq('user_id', userId)
        .eq('curso_id', curso.id)
        .select();

    if (delCompraError) {
        console.error('Error al borrar compras:', delCompraError);
    } else {
        console.log('Compras borradas con éxito:', deletedCompras);
    }

    // 4. Find all exams for this course
    const { data: examenes, error: examenesError } = await supabase
        .from('ie_examenes')
        .select('id, modulo_id')
        .eq('curso_id', curso.id);

    if (examenesError) {
        console.error('Error al buscar exámenes:', examenesError);
    } else if (examenes && examenes.length > 0) {
        const examIds = examenes.map(e => e.id);
        console.log('Exámenes del curso encontrados:', examIds);

        // Delete from ie_resultados_examenes
        const { data: deletedResultados, error: delResError } = await supabase
            .from('ie_resultados_examenes')
            .delete()
            .eq('user_id', userId)
            .in('examen_id', examIds)
            .select();

        if (delResError) {
            console.error('Error al borrar resultados de examen (ie_resultados_examenes):', delResError);
        } else {
            console.log('Resultados de examen (ie_resultados_examenes) borrados:', deletedResultados);
        }
    } else {
        console.log('No se encontraron exámenes para este curso.');
    }

    // 5. Delete from ie_examenes_usuario
    const { data: deletedExUsuario, error: delExUsuarioError } = await supabase
        .from('ie_examenes_usuario')
        .delete()
        .eq('user_id', userId)
        .eq('curso_id', curso.id)
        .select();

    if (delExUsuarioError) {
        console.error('Error al borrar de ie_examenes_usuario:', delExUsuarioError);
    } else {
        console.log('Registros de ie_examenes_usuario borrados:', deletedExUsuario);
    }

    // 6. Delete from ie_progreso_modulos
    const { data: deletedProgreso, error: delProgresoError } = await supabase
        .from('ie_progreso_modulos')
        .delete()
        .eq('user_id', userId)
        .eq('curso_id', curso.id)
        .select();

    if (delProgresoError) {
        console.error('Error al borrar de ie_progreso_modulos:', delProgresoError);
    } else {
        console.log('Progreso de módulos borrado con éxito:', deletedProgreso);
    }
}

run();
