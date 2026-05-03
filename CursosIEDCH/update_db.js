require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL
    });
    
    try {
        await client.connect();
        
        await client.query("ALTER TABLE ie_profiles DROP CONSTRAINT IF EXISTS ie_profiles_rol_check;");
        await client.query("ALTER TABLE ie_profiles ADD CONSTRAINT ie_profiles_rol_check CHECK (rol IN ('admin', 'profesor', 'alumno', 'financiero'));");
        
        console.log("Constraint updated successfully");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
