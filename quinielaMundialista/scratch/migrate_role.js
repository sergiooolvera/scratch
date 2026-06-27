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

async function migrateRole() {
  try {
    console.log("⏳ Intentando conectar con Supabase Pooler...");
    await client.connect();
    console.log("✅ ¡Conexión exitosa a Supabase PostgreSQL!");

    console.log("Añadiendo columna 'role' a la tabla 'qui_profiles'...");
    await client.query(`
      ALTER TABLE public.qui_profiles 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
      CHECK (role IN ('user', 'vendedor', 'admin'));
    `);
    console.log("✅ Columna 'role' añadida/verificada.");

    await client.end();
  } catch (error) {
    console.error("❌ Error ejecutando migración:", error.message);
  }
}

migrateRole();
