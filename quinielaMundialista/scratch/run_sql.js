const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";

const client = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.gyyrcilivzqxzgkcgzfe',
  password: MI_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSQL() {
  try {
    console.log("⏳ Connecting to Supabase us-west-2 Pooler...");
    await client.connect();
    console.log("✅ Connected successfully!");

    // Check the constraint definition
    const res = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint
      WHERE conname = 'qui_profiles_role_check';
    `);
    console.log('\n--- Current constraint ---');
    console.log(res.rows[0] || 'Not found');

    // Drop and recreate the constraint to include 'promotor'
    await client.query(`
      ALTER TABLE public.qui_profiles 
      DROP CONSTRAINT IF EXISTS qui_profiles_role_check;
    `);
    console.log('\n✅ Constraint dropped');

    await client.query(`
      ALTER TABLE public.qui_profiles 
      ADD CONSTRAINT qui_profiles_role_check 
      CHECK (role IN ('user', 'vendedor', 'admin', 'promotor'));
    `);
    console.log('✅ Constraint recreated with promotor');

    await client.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

runSQL();
