const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const cursoId = '5deee6df-f7ed-4a01-b137-499794402b0c';
  
  const { data: curso } = await supabase
    .from('ie_cursos')
    .select('*')
    .eq('id', cursoId)
    .single();
    
  console.log('--- CURSO ---');
  console.log(curso);
  
  const { data: compras } = await supabase
    .from('ie_compras')
    .select('*')
    .eq('curso_id', cursoId);
    
  console.log('--- COMPRAS ---');
  console.log(compras);
}

main();
