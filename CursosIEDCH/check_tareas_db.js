require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const cursoId = '5deee6df-f7ed-4a01-b137-499794402b0c';
    
    const { data: tareas, error } = await supabase
        .from('ie_preguntas_respuestas')
        .select('*')
        .eq('curso_id', cursoId)
        .like('pregunta', 'TAREA_DEFINICION:%');
    
    if (error) {
        console.error("Error fetching tasks:", error);
        return;
    }
    
    console.log("Tareas encontradas en ie_preguntas_respuestas para MATEMATICAS 2:", tareas.length);
    tareas.forEach(t => {
        console.log("ID:", t.id, "Pregunta:", t.pregunta);
    });
}

main();
