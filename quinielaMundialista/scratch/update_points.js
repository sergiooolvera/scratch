const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load env variables from local files
function loadEnv() {
  const envFiles = ['.env.production.local', '.env.local', '.env'];
  let env = {};
  for (const file of envFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`Loading env from ${file}...`);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const index = trimmed.indexOf('=');
        if (index > 0) {
          const key = trimmed.slice(0, index).trim();
          let value = trimmed.slice(index + 1).trim();
          // Remove wrapping quotes
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!env[key]) {
            env[key] = value;
          }
        }
      }
    }
  }
  return env;
}

async function run() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase URL or Service Role Key was not found in environment files.');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log('Updating qui_system_settings "points_config" configuration...');
  const { data, error } = await supabaseAdmin
    .from('qui_system_settings')
    .upsert({
      id: 'points_config',
      points_exact_score: 5,
      points_correct_winner: 1,
      points_correct_draw: 1,
      points_incorrect: 1
    });

  if (error) {
    console.error('Error updating settings:', error.message);
    process.exit(1);
  }

  console.log('✅ Success! Points configuration updated successfully to:');
  console.log('   - Marcador exacto: 5 pts');
  console.log('   - Resultado (Ganador): 3 pts');
  console.log('   - Resultado (Empate): 3 pts');
  console.log('   - No atinado: 0 pts');
}

run();
