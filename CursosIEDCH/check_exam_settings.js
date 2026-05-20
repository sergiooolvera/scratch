require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const cursoId = "5deee6df-f7ed-4a01-b137-499794402b0c";
    
    const { data: examen, error } = await supabase
        .from('ie_examenes')
        .select('*')
        .eq('curso_id', cursoId)
        .single();
    
    if (error) {
        console.error("Error fetching exam:", error);
        return;
    }
    
    console.log("Exam Settings:", examen);
}

run();
