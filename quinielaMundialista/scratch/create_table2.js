const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";

const targets = [
  // Try direct connection with postgres user (not pooler format)
  { host: 'db.gyyrcilivzqxzgkcgzfe.supabase.co', port: 5432, user: 'postgres', database: 'postgres' },
  // Try poolers with postgres user
  { host: 'aws-0-us-west-2.pooler.supabase.com', port: 6543, user: 'postgres', database: 'postgres' },
  { host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543, user: 'postgres', database: 'postgres' },
];

async function tryConnect(cfg) {
  const client = new Client({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: MI_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    return client;
  } catch (e) {
    console.log(`❌ ${cfg.user}@${cfg.host}:${cfg.port} - ${e.message}`);
    return null;
  }
}

async function run() {
  let client = null;
  for (const t of targets) {
    client = await tryConnect(t);
    if (client) break;
  }

  if (!client) {
    console.error('Could not connect.');
    process.exit(1);
  }

  console.log('✅ Connected!');

  // Create promoter info table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.qui_promoter_info (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.qui_profiles(id) ON DELETE CASCADE UNIQUE,
      full_name TEXT NOT NULL DEFAULT '',
      phone TEXT DEFAULT '',
      phone_verified BOOLEAN DEFAULT FALSE,
      verification_code TEXT,
      code_expires_at TIMESTAMP WITH TIME ZONE,
      clabe TEXT DEFAULT '',
      bank_name TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Table qui_promoter_info created');

  // Enable RLS
  await client.query(`
    ALTER TABLE public.qui_promoter_info ENABLE ROW LEVEL SECURITY;
  `);
  console.log('✅ RLS enabled');

  // Create policies
  await client.query(`
    DROP POLICY IF EXISTS "Users can view their own promoter info" ON public.qui_promoter_info;
    CREATE POLICY "Users can view their own promoter info" 
      ON public.qui_promoter_info FOR SELECT 
      USING (auth.uid() = user_id);
  `);
  console.log('✅ SELECT policy created');

  await client.query(`
    DROP POLICY IF EXISTS "Users can insert their own promoter info" ON public.qui_promoter_info;
    CREATE POLICY "Users can insert their own promoter info" 
      ON public.qui_promoter_info FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  `);
  console.log('✅ INSERT policy created');

  await client.query(`
    DROP POLICY IF EXISTS "Users can update their own promoter info" ON public.qui_promoter_info;
    CREATE POLICY "Users can update their own promoter info" 
      ON public.qui_promoter_info FOR UPDATE 
      USING (auth.uid() = user_id);
  `);
  console.log('✅ UPDATE policy created');

  // Admin can see all
  await client.query(`
    DROP POLICY IF EXISTS "Admins can view all promoter info" ON public.qui_promoter_info;
    CREATE POLICY "Admins can view all promoter info" 
      ON public.qui_promoter_info FOR SELECT 
      USING (
        EXISTS (SELECT 1 FROM public.qui_profiles WHERE id = auth.uid() AND is_admin = TRUE)
      );
  `);
  console.log('✅ Admin policy created');

  // Grant usage
  await client.query(`GRANT ALL ON public.qui_promoter_info TO authenticated;`);
  await client.query(`GRANT ALL ON public.qui_promoter_info TO service_role;`);
  console.log('✅ Grants applied');

  // Verify
  const res = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'qui_promoter_info'
    ORDER BY ordinal_position;
  `);
  console.log('\n--- Columns ---');
  res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  await client.end();
  console.log('\nDone!');
}

run().catch(e => console.error(e.message));
