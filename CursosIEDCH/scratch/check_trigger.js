require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');

async function check() {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT prosrc 
            FROM pg_proc 
            WHERE proname = 'handle_new_user';
        `);
        console.log('--- TRIGGER FUNCTION DEFINITION ---');
        console.log(res.rows[0]?.prosrc);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
