const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Let's try to insert an exam with an existing curso_id
  const cursoId = "5deee6df-f7ed-4a01-b137-499794402b0c"; // Existing course ID from check_exam_settings.js
  const { data, error } = await supabase.from('ie_examenes').insert({
    curso_id: cursoId,
    min_aprobacion: 80
  });
  
  if (error) {
    console.log("Error inserting duplicate:", error.message);
    console.log("Error details:", error);
  } else {
    console.log("Insert succeeded (no unique constraint on curso_id):", data);
    // Cleanup if succeeded
    if (data && data[0]) {
      await supabase.from('ie_examenes').delete().eq('id', data[0].id);
    }
  }
}

run();
