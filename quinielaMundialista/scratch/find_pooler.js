const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";
const regions = [
  'aws-0-us-west-1',
  'aws-0-us-west-2',
  'aws-0-us-east-1',
  'aws-0-us-east-2',
  'aws-0-sa-east-1',
  'aws-0-ca-central-1',
  'aws-1-us-east-1'
];

async function findPooler() {
  for (const reg of regions) {
    const host = `${reg}.pooler.supabase.com`;
    console.log(`Testing host: ${host}`);
    const client = new Client({
      host: host,
      port: 6543,
      database: 'postgres',
      user: 'postgres.gyyrcilivzqxzgkcgzfe',
      password: MI_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS connecting to: ${host}`);
      
      const res = await client.query(`
        SELECT 
          tgname AS trigger_name,
          relname AS table_name,
          proname AS function_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' OR n.nspname = 'auth';
      `);
      console.log('Triggers found:', res.rows);
      
      await client.end();
      return;
    } catch (e) {
      console.log(`❌ Failed ${host}:`, e.message);
    }
  }
}

findPooler();
