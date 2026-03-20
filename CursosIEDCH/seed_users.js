require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// using the provided key assuming it is a service role key

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('Creando usuario Profesor (Admin API)...');
    const { data: profData, error: profError } = await supabase.auth.admin.createUser({
        email: 'profesor@iedch.edu.mx',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            nombre: 'Carlos (Profesor)'
        }
    });

    if (profError) {
        console.error('Error Profesor:', profError.message);
    } else {
        console.log('Profesor creado. ID:', profData.user.id);
        const { error: updateProf } = await supabase
            .from('ie_profiles')
            .update({ rol: 'profesor' })
            .eq('id', profData.user.id);
        if (updateProf) console.error('Error actualizando rol profesor:', updateProf.message);
        else console.log('Rol asignado a profesor exitosamente.');
    }

    console.log('\nCreando usuario Admin (Admin API)...');
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: 'admin@iedch.edu.mx',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            nombre: 'Ana (Admin)'
        }
    });

    if (adminError) {
        console.error('Error Admin:', adminError.message);
    } else {
        console.log('Admin creado. ID:', adminData.user.id);
        const { error: updateAdmin } = await supabase
            .from('ie_profiles')
            .update({ rol: 'admin' })
            .eq('id', adminData.user.id);
        if (updateAdmin) console.error('Error actualizando rol admin:', updateAdmin.message);
        else console.log('Rol asignado a admin exitosamente.');
    }
}

main();
