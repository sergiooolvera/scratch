const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const vars = {};
lines.forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    vars[parts[0].trim()] = parts[1].trim().replace(/^"|"$/g, '');
  }
});

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('pl_categories')
    .select('*')
    .eq('slug', 'dia-madres');

  console.log('Query result:', data);
  console.log('Query error:', error);
}

run();
