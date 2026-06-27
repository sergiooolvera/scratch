const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'patsy@quiniela.com';
  const password = 'patsy2026';

  console.log(`Creando usuario en Auth para ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Bypass de confirmación por correo
  });

  let userId;

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('El usuario ya existe en Auth. Buscando ID...');
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
            const u = users.find(x => x.email === email);
            if (u) userId = u.id;
        }
    } else {
        console.error('❌ Error de Auth:', authError.message);
        return;
    }
  } else {
      userId = authData?.user?.id;
      console.log('✅ Usuario creado correctamente.');
  }

  if (!userId) {
      console.log('❌ No se pudo determinar el ID del usuario.');
      return;
  }
  
  console.log(`ID de usuario: ${userId}`);
  
  // Darle un segundo al trigger de la BD para que genere el perfil automáticamente
  console.log('Esperando generación de perfil por trigger...');
  await new Promise(r => setTimeout(r, 1500));

  console.log('Asignando privilegios de administrador...');
  const { error: profError } = await supabase
    .from('qui_profiles')
    .update({ 
        is_admin: true, 
        is_active: true, // También le activamos la aportación
        username: 'patsyadmin', 
        full_name: 'Patsy Administradora' 
    })
    .eq('id', userId);

  if (profError) {
    console.error('❌ Error actualizando el perfil:', profError.message);
  } else {
    console.log('✅ ¡Perfil actualizado! patsy@quiniela.com ahora es Administrador y tiene su quiniela activa.');
  }
}

createAdmin();
