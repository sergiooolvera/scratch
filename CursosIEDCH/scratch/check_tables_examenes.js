const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkExams() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: res1, error: err1 } = await supabase.from('ie_resultados_examenes').select('*').limit(1);
    if (!err1 && res1 && res1.length > 0) {
        console.log('Columns of ie_resultados_examenes:', Object.keys(res1[0]));
    } else {
        console.log('ie_resultados_examenes error or empty:', err1?.message || 'empty');
    }

    const { data: res2, error: err2 } = await supabase.from('ie_examenes_usuario').select('*').limit(1);
    if (!err2 && res2 && res2.length > 0) {
        console.log('Columns of ie_examenes_usuario:', Object.keys(res2[0]));
    } else {
        console.log('ie_examenes_usuario error or empty:', err2?.message || 'empty');
    }
}

checkExams();
