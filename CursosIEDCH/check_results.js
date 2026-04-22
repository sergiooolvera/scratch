const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserResults() {
  const userId = '5302e955-6014-4e6b-8065-95254b393229';
  const { data: results, error } = await supabase
    .from('ie_resultados_examenes')
    .select('*, ie_examenes(curso_id, ie_cursos(titulo))')
    .eq('user_id', userId);
  
  if (error) console.error(error);
  else console.log(JSON.stringify(results, null, 2));
}

checkUserResults();
