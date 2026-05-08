require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log(`Connecting to Supabase at: ${supabaseUrl}`);
        
        // Create the bucket 'perfiles'
        const { data, error } = await supabase.storage.createBucket('perfiles', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
        });

        if (error) {
            if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
                console.log("Bucket 'perfiles' already exists. Perfect!");
            } else {
                throw error;
            }
        } else {
            console.log("Bucket 'perfiles' successfully created!");
            console.log(data);
        }

        console.log("\nBucket configuration successfully verified/created via Admin SDK!");
        console.log("\nIMPORTANT NOTE:\nIf uploads fail with a permissions error from the client browser, you will need to apply storage policies. To do this, run the following SQL query in the Supabase Dashboard SQL Editor:\n");
        console.log(`
-- 1. Permitir acceso de lectura público a 'perfiles'
CREATE POLICY "Acceso de lectura público perfiles" ON storage.objects 
FOR SELECT USING (bucket_id = 'perfiles');

-- 2. Permitir inserciones a usuarios autenticados
CREATE POLICY "Permitir subida a usuarios autenticados perfiles" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'perfiles' AND auth.role() = 'authenticated');

-- 3. Permitir actualizaciones a usuarios autenticados
CREATE POLICY "Permitir actualización a usuarios autenticados perfiles" ON storage.objects 
FOR UPDATE USING (bucket_id = 'perfiles' AND auth.role() = 'authenticated');

-- 4. Permitir eliminaciones a usuarios autenticados
CREATE POLICY "Permitir eliminación a usuarios autenticados perfiles" ON storage.objects 
FOR DELETE USING (bucket_id = 'perfiles' AND auth.role() = 'authenticated');
        `);

    } catch (e) {
        console.error("Error configuring storage bucket:", e);
    }
}

run();
