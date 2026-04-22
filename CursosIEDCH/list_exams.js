const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listExams() {
  const { data: exams, error } = await supabase.from('ie_examenes').select('id, curso_id, ie_cursos(titulo)');
  if (error) console.error(error);
  else console.log(JSON.stringify(exams, null, 2));
}

listExams();
