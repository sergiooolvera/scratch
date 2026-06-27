const { Client } = require('pg');

const MI_PASSWORD = "nfLccrvl66xQuHXZ";

const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.gyyrcilivzqxzgkcgzfe',
  password: MI_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function probarConexion() {
  try {
    console.log("⏳ Intentando conectar con Supabase Pooler (Quiniela)...");
    await client.connect();
    console.log("✅ ¡Conexión exitosa a Supabase PostgreSQL!");

    // List all triggers on auth.users
    const res = await client.query(`
      SELECT 
        tgname AS trigger_name,
        relname AS table_name,
        proname AS function_name
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE n.nspname = 'auth' AND relname = 'users';
    `);
    
    console.log("Found triggers on auth.users:");
    console.log(res.rows);

    await client.end();
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

probarConexion();
