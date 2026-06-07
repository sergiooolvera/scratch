const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function inspectCursos() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.from('ie_cursos').select('*').limit(1);
    if (error) {
        console.error('Error fetching course:', error);
        return;
    }
    console.log('Columns of ie_cursos:', Object.keys(data[0] || {}));
}

inspectCursos();
