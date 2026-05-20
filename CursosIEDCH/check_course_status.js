require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const cursoId = "5deee6df-f7ed-4a01-b137-499794402b0c";
    
    const { data: curso, error } = await supabase
        .from('ie_cursos')
        .select('estado, cambios_pendientes')
        .eq('id', cursoId)
        .single();
    
    if (error) {
        console.error("Error fetching course:", error);
        return;
    }
    
    console.log("Course Status:", curso.estado);
    console.log("Cambios Pendientes:", curso.cambios_pendientes);
}

run();
