require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRoles() {
    // Fix Profesor
    const { data: profAuth } = await supabase.auth.signInWithPassword({
        email: 'profesor@iedch.edu.mx',
        password: 'password123'
    });
    if (profAuth.user) {
        const { error } = await supabase.from('ie_profiles').update({ rol: 'profesor' }).eq('id', profAuth.user.id);
        console.log('Profesor update error?', error?.message || 'Correcto');
    }

    // Fix Admin
    const { data: adminAuth } = await supabase.auth.signInWithPassword({
        email: 'admin@iedch.edu.mx',
        password: 'password123'
    });
    if (adminAuth.user) {
        const { error } = await supabase.from('ie_profiles').update({ rol: 'admin' }).eq('id', adminAuth.user.id);
        console.log('Admin update error?', error?.message || 'Correcto');
    }
}
fixRoles();
