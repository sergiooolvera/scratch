const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function getSchemas() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tables = ['ie_cursos', 'ie_curso_modulos', 'ie_examenes', 'ie_preguntas', 'ie_resultados_examenes'];
  for (const t of tables) {
    console.log(`\n--- Schema for ${t} ---`);
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.error(`Error fetching ${t}:`, error.message);
    } else {
      console.log('Columns:', Object.keys(data?.[0] || {}));
    }
  }
}

getSchemas();
