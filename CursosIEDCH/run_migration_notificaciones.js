require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!connectionString) {
        console.error('No DATABASE_URL or DIRECT_URL found in env!');
        process.exit(1);
    }

    const client = new Client({ connectionString });
    
    try {
        await client.connect();
        console.log('Connected to PostgreSQL database.');
        
        const sqlPath = path.join(__dirname, 'crear_tabla_notificaciones.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Executing SQL migration...');
        await client.query(sql);
        console.log('Migration executed successfully!');
    } catch (e) {
        console.error('Error executing migration:', e);
    } finally {
        await client.end();
    }
}

run();
