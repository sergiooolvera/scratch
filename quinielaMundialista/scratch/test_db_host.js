const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";

async function testConnection() {
  const hosts = [
    'db.gyyrcilivzqxzgkcgzfe.supabase.co',
    'aws-0-us-west-2.pooler.supabase.com',
  ];

  for (const host of hosts) {
    console.log(`⏳ Testing host: ${host}`);
    const client = new Client({
      host: host,
      port: 5432, // standard port
      database: 'postgres',
      user: 'postgres',
      password: MI_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`✅ Success connecting to ${host} on port 5432!`);
      const res = await client.query('SELECT current_user, current_database();');
      console.log(res.rows);
      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Failed port 5432 on ${host}:`, err.message);
    }

    console.log(`⏳ Testing host on port 6543: ${host}`);
    const clientPort = new Client({
      host: host,
      port: 6543, // pooler port
      database: 'postgres',
      user: 'postgres', // try postgres as username
      password: MI_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });

    try {
      await clientPort.connect();
      console.log(`✅ Success connecting to ${host} on port 6543!`);
      const res = await clientPort.query('SELECT current_user, current_database();');
      console.log(res.rows);
      await clientPort.end();
      return;
    } catch (err) {
      console.log(`❌ Failed port 6543 on ${host}:`, err.message);
    }
  }
}

testConnection();
