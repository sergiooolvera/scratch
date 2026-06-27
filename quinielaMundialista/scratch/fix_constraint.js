const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";

// Try both pooler hosts
const hosts = [
  { host: 'aws-0-us-west-2.pooler.supabase.com', port: 6543 },
  { host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543 },
];

async function tryConnect(clientConfig) {
  const client = new Client({
    host: clientConfig.host,
    port: clientConfig.port,
    database: 'postgres',
    user: 'postgres.gyyrcilivzqxzgkcgzfe',
    password: MI_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    return client;
  } catch (e) {
    console.log(`❌ ${clientConfig.host}:${clientConfig.port} - ${e.message}`);
    return null;
  }
}

async function run() {
  let client = null;
  for (const h of hosts) {
    client = await tryConnect(h);
    if (client) break;
  }

  if (!client) {
    console.error('Could not connect to any host.');
    process.exit(1);
  }

  console.log('✅ Connected!');

  // Check current constraint
  const checkRes = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) as constraint_def
    FROM pg_constraint
    WHERE conname = 'qui_profiles_role_check';
  `);
  console.log('\n--- Current constraint ---');
  console.log(checkRes.rows[0] || 'Not found');

  // Drop and recreate
  await client.query(`
    ALTER TABLE public.qui_profiles 
    DROP CONSTRAINT IF EXISTS qui_profiles_role_check;
  `);
  console.log('✅ Constraint dropped');

  await client.query(`
    ALTER TABLE public.qui_profiles 
    ADD CONSTRAINT qui_profiles_role_check 
    CHECK (role IN ('user', 'vendedor', 'admin', 'promotor'));
  `);
  console.log('✅ Constraint recreated with promotor');

  await client.end();
  console.log('\nDone!');
}

run().catch(e => console.error(e.message));
