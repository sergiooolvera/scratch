require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    // 1. Find course "MATEMATICAS"
    const { data: curso, error: cursoError } = await supabase
        .from('ie_cursos')
        .select('id, titulo')
        .eq('titulo', 'MATEMATICAS')
        .single();

    if (cursoError) {
        console.error('Error finding course:', cursoError);
        return;
    }
    console.log('Course found:', curso);

    // 2. Find exam for this course
    const { data: examen, error: examenError } = await supabase
        .from('ie_examenes')
        .select('id')
        .eq('curso_id', curso.id)
        .single();

    if (examenError) {
        console.error('Error finding exam:', examenError);
        return;
    }
    console.log('Exam found:', examen);

    // 3. Find results for this exam
    const { data: res, error: resError } = await supabase
        .from('ie_resultados_examenes')
        .select('*')
        .eq('examen_id', examen.id);

    if (resError) {
        console.error('Error finding results:', resError);
        return;
    }
    console.log('Results found:', res);
}

check();
