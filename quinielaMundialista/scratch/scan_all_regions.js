const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";
const regions = [
  'aws-0-us-east-1',
  'aws-0-us-east-2',
  'aws-0-us-west-1',
  'aws-0-us-west-2',
  'aws-0-ca-central-1',
  'aws-0-eu-west-1',
  'aws-0-eu-west-2',
  'aws-0-eu-west-3',
  'aws-0-eu-central-1',
  'aws-0-ap-southeast-1',
  'aws-0-ap-southeast-2',
  'aws-0-ap-northeast-1',
  'aws-0-ap-northeast-2',
  'aws-0-ap-south-1',
  'aws-0-sa-east-1'
];

async function scanAll() {
  for (const reg of regions) {
    const host = `${reg}.pooler.supabase.com`;
    const client = new Client({
      host: host,
      port: 6543,
      database: 'postgres',
      user: 'postgres.gyyrcilivzqxzgkcgzfe',
      password: MI_PASSWORD,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 2000
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS connecting to: ${host}`);
      await client.end();
      return;
    } catch (e) {
      if (e.message.includes('password authentication failed')) {
        console.log(`📍 REGION FOUND: ${host} (but password failed)`);
      } else if (e.message.includes('Tenant or user not found')) {
        // Connected but tenant not in this region
      } else {
        // Network timeout / ENOTFOUND
      }
    }
  }
  console.log('Scan complete.');
}

scanAll();
