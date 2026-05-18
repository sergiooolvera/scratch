const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const vars = {};
lines.forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    vars[parts[0].trim()] = parts[1].trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = vars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = vars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('pl_categories')
    .insert([{ name: 'Día de las Madres', slug: 'dia-madres' }])
    .select();

  if (error) {
    console.error('Error al insertar categoría:', error);
  } else {
    console.log('Categoría insertada con éxito:', data);
  }
}

run();
