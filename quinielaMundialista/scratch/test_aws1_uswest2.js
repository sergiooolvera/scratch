const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";

async function test() {
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

  try {
    console.log("Connecting...");
    await client.connect();
    console.log("SUCCESS!");
    await client.end();
  } catch (err) {
    console.error("Connection error code:", err.code);
    console.error("Connection error message:", err.message);
  }
}

test();
