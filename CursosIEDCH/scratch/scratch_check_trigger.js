const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTrigger() {
    const testEmail = `test_instructor_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    console.log(`Signing up test user: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
            nombre: 'Test',
            apellido_paterno: 'Instructor',
            rol: 'instructor'
        }
    });

    if (signUpError) {
        console.error('Signup error:', signUpError);
        return;
    }

    const userId = signUpData.user.id;
    console.log(`User created with ID: ${userId}`);

    // Wait a brief moment for the trigger to run
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch the profile
    const { data: profileData, error: profileError } = await supabase
        .from('ie_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    } else {
        console.log('Created profile:', profileData);
    }

    // Clean up
    console.log('Cleaning up test user...');
    await supabase.auth.admin.deleteUser(userId);
    console.log('Done.');
}

checkTrigger();
