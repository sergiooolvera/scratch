require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL
    });
    
    try {
        await client.connect();
        
        // Let's first query the current constraint definition just to log it
        const res = await client.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'ie_cursos_estado_check'");
        console.log("Current constraint:", res.rows[0]);

        await client.query("ALTER TABLE ie_cursos DROP CONSTRAINT IF EXISTS ie_cursos_estado_check;");
        await client.query("ALTER TABLE ie_cursos ADD CONSTRAINT ie_cursos_estado_check CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'eliminado', 'borrador'));");
        
        console.log("Constraint updated successfully");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
