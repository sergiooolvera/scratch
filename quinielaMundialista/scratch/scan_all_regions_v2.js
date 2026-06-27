const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";
const baseRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'sa-east-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1'
];

async function scanAll() {
  const prefixes = ['aws-0', 'aws-1', 'aws-2'];
  
  for (const prefix of prefixes) {
    for (const reg of baseRegions) {
      const host = `${prefix}-${reg}.pooler.supabase.com`;
      const client = new Client({
        host: host,
        port: 6543,
        database: 'postgres',
        user: 'postgres.gyyrcilivzqxzgkcgzfe',
        password: MI_PASSWORD,
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 1500
      });

      try {
        await client.connect();
        console.log(`🎉 SUCCESS connecting to: ${host}`);
        await client.end();
        return;
      } catch (e) {
        if (e.message.includes('password authentication failed')) {
          console.log(`📍 REGION FOUND: ${host} (but password failed)`);
        } else if (e.message.includes('Tenant or user not found') || e.message.includes('tenant/user') || e.message.includes('not found')) {
          // Connected but tenant not in this region
        } else {
          // DNS or other error
        }
      }
    }
  }
  console.log('Scan complete.');
}

scanAll();
