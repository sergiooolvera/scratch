const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('ie_examenes')
    .select('*')
    .eq('curso_id', '5deee6df-f7ed-4a01-b137-499794402b0c');
  if (error) console.error(error);
  else console.log("Exams for course:", data);
}

run();
