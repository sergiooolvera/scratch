const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";

const client = new Client({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.gyyrcilivzqxzgkcgzfe',
  password: MI_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log("⏳ Connecting to aws-1-us-west-2.pooler.supabase.com...");
    await client.connect();
    console.log("✅ Success!");
    await client.end();
  } catch (error) {
    console.error("❌ Full Connection Error:");
    console.error(error);
  }
}

run();
