require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL
    });
    
    try {
        await client.connect();
        
        console.log("Creating ie_reviews table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS ie_reviews (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                curso_id UUID REFERENCES ie_cursos(id) ON DELETE CASCADE,
                user_id UUID REFERENCES ie_profiles(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comentario TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(curso_id, user_id)
            );
        `);
        console.log("ie_reviews table created.");

        console.log("Enabling RLS on ie_reviews...");
        await client.query(`
            ALTER TABLE ie_reviews ENABLE ROW LEVEL SECURITY;
        `);

        console.log("Creating policies...");
        await client.query(`
            DROP POLICY IF EXISTS "Permitir lectura publica de valoraciones" ON ie_reviews;
            CREATE POLICY "Permitir lectura publica de valoraciones"
                ON ie_reviews FOR SELECT
                USING (true);
        `);

        await client.query(`
            DROP POLICY IF EXISTS "Permitir insertar valoraciones a usuarios autenticados" ON ie_reviews;
            CREATE POLICY "Permitir insertar valoraciones a usuarios autenticados"
                ON ie_reviews FOR INSERT
                WITH CHECK (
                    auth.uid() = user_id
                );
        `);

        await client.query(`
            DROP POLICY IF EXISTS "Permitir actualizar/eliminar su propia valoracion" ON ie_reviews;
            CREATE POLICY "Permitir actualizar/eliminar su propia valoracion"
                ON ie_reviews FOR ALL
                USING (auth.uid() = user_id);
        `);

        console.log("All database operations completed successfully!");
    } catch (e) {
        console.error("Error creating ie_reviews schema:", e);
    } finally {
        await client.end();
    }
}

run();
