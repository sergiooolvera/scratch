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

async function runMigration() {
  try {
    console.log("⏳ Conectando con PostgreSQL...");
    await client.connect();
    console.log("✅ Conectado.");

    console.log("Adding commission settings to 'qui_system_settings'...");
    await client.query(`
      ALTER TABLE public.qui_system_settings 
      ADD COLUMN IF NOT EXISTS seller_commission_1_10 NUMERIC DEFAULT 0.20,
      ADD COLUMN IF NOT EXISTS seller_commission_11_25 NUMERIC DEFAULT 0.25,
      ADD COLUMN IF NOT EXISTS seller_commission_26_up NUMERIC DEFAULT 0.30;
    `);
    console.log("✅ Commission settings columns added.");

    console.log("Adding seller_request_status to 'qui_profiles'...");
    await client.query(`
      ALTER TABLE public.qui_profiles 
      ADD COLUMN IF NOT EXISTS seller_request_status TEXT DEFAULT 'none';
    `);

    // Add constraint if not exists
    try {
      await client.query(`
        ALTER TABLE public.qui_profiles
        ADD CONSTRAINT chk_seller_request_status 
        CHECK (seller_request_status IN ('none', 'pending', 'approved', 'rejected'));
      `);
      console.log("✅ Constraint for seller_request_status added.");
    } catch (err) {
      console.log("ℹ️ Constraint might already exist:", err.message);
    }

    console.log("Checking structure of 'qui_system_settings'...");
    const settingsSchema = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'qui_system_settings';
    `);
    console.log(settingsSchema.rows);

    console.log("Checking structure of 'qui_profiles'...");
    const profilesSchema = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'qui_profiles' AND column_name IN ('role', 'seller_request_status');
    `);
    console.log(profilesSchema.rows);

    await client.end();
  } catch (error) {
    console.error("❌ Error en la migración:", error.message);
  }
}

runMigration();
