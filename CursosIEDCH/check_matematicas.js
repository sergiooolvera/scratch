require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data: curso, error } = await supabase
        .from('ie_cursos')
        .select('id, titulo, creado_por, cambios_pendientes')
        .ilike('titulo', '%matem%2%')
        .single();
    
    if (error) {
        console.error("Error fetching course:", error);
        return;
    }
    
    console.log("Curso encontrado:", curso.titulo, "ID:", curso.id);
    
    const { data: modulos } = await supabase
        .from('ie_curso_modulos')
        .select('*')
        .eq('curso_id', curso.id);
        
    console.log("Módulos encontrados:", modulos.length);
    console.log(modulos.map(m => m.titulo));
    
    if (curso.cambios_pendientes) {
        console.log("¡Tiene cambios_pendientes (borrador)!");
        console.log("Modulos en borrador:", curso.cambios_pendientes.modulos.map(m => m.titulo));
        const tareas = curso.cambios_pendientes.modulos.filter(m => m.requiereTarea);
        console.log("Módulos que requieren tarea en el borrador:", tareas.length);
    } else {
        console.log("No tiene cambios pendientes.");
    }
}

main();
