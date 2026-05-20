const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`Error on ${tableName}:`, error.message);
  } else if (data && data.length > 0) {
    console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
  } else {
    console.log(`Table ${tableName} is empty, but query succeeded.`);
  }
}

async function run() {
  await checkTable('ie_cursos');
  await checkTable('ie_curso_modulos');
  await checkTable('ie_examenes');
  await checkTable('ie_preguntas');
  await checkTable('ie_resultados_examenes');
}

run();
