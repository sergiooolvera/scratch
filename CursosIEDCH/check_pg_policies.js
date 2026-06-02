require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data, error } = await supabase.rpc('query_pg_policies_custom');
    if (error) {
        // Fallback: raw query on postgres
        const { data: qData, error: qErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'ie_preguntas_respuestas');
        if (qErr) {
            console.error("Error direct query:", qErr);
        } else {
            console.log("Policies via direct query:", qData);
        }
    } else {
        console.log(data);
    }
}

main();
