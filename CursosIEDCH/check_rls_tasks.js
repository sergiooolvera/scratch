require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key to test RLS
);

async function main() {
    const cursoId = '5deee6df-f7ed-4a01-b137-499794402b0c';
    
    // Login as a student? We don't have a student token, but we can check if it requires auth.
    // Let's use service_role first to see the data, then anon to see if it's blocked.
    
    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: adminData } = await adminSupabase
        .from('ie_preguntas_respuestas')
        .select('id, user_id, pregunta, respuesta')
        .eq('curso_id', cursoId)
        .like('pregunta', 'TAREA_DEFINICION:%');
        
    console.log("Admin Data:", adminData);
}

main();
