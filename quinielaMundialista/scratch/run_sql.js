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

    // Run a query to test connection
    const res = await client.query('SELECT current_user, current_database();');
    console.log('Result:', res.rows);

    await client.end();
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

runSQL();
