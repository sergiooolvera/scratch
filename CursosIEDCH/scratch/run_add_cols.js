require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL
    });
    
    try {
        await client.connect();
        
        console.log("Adding columns to ie_profiles...");
        await client.query(`
            ALTER TABLE ie_profiles 
            ADD COLUMN IF NOT EXISTS telefono TEXT,
            ADD COLUMN IF NOT EXISTS banco TEXT,
            ADD COLUMN IF NOT EXISTS clabe TEXT;
        `);
        
        console.log("Columns added successfully");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
