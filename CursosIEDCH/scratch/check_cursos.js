const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.from('ie_cursos').select('*').limit(1);
  if (error) {
    console.error('Error fetching course:', error);
  } else {
    console.log('Course columns:', Object.keys(data[0] || {}));
  }
}

check();
