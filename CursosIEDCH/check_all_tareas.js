require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data: tareas, error } = await supabase
        .from('ie_preguntas_respuestas')
        .select('*')
        .like('pregunta', 'TAREA_DEFINICION:%');
    
    if (error) {
        console.error("Error fetching tasks:", error);
        return;
    }
    
    console.log("Total de tareas (TAREA_DEFINICION) en toda la BD:", tareas.length);
    tareas.forEach(t => {
        console.log("ID:", t.id, "Curso ID:", t.curso_id, "Pregunta:", t.pregunta);
    });
}

main();
