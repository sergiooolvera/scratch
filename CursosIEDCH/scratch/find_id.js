const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const userId = '5302e955-6014-4e6b-8065-95254b393229';

async function main() {
    console.log(`Checking exam results for user ${userId}...\n`);

    const { data: res1 } = await supabase
        .from('ie_resultados_examenes')
        .select('*')
        .eq('user_id', userId);
    console.log('ie_resultados_examenes:', res1);

    const { data: res2 } = await supabase
        .from('ie_examenes_usuario')
        .select('*')
        .eq('user_id', userId);
    console.log('ie_examenes_usuario:', res2);
}

main();
