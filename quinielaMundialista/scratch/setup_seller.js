const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSeller() {
  const email = 'jorge.enriquez@quiniela.com';
  const password = '123456';

  console.log(`\n--- Configurando usuario vendedor: ${email} ---`);
  console.log(`Creando usuario en Auth...`);
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  let userId;

  if (authError) {
    console.log('Error de Auth (puede ser que ya exista):', authError.message);
    console.log('Buscando ID de usuario por email...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (!listError) {
        const u = users.find(x => x.email === email);
        if (u) {
          userId = u.id;
          console.log('✅ Encontrado usuario existente con ID:', userId);
        } else {
          console.error('❌ No se encontró un usuario con ese email en la lista.');
          return;
        }
    } else {
        console.error('❌ Error listando usuarios:', listError.message);
        return;
    }
  } else {
      userId = authData?.user?.id;
      console.log('✅ Usuario creado en Auth.');
  }

  if (!userId) {
      console.log('❌ No se pudo determinar el ID del usuario.');
      return;
  }
  
  console.log(`ID del usuario: ${userId}`);
  
  // Esperar a que el trigger cree el registro en qui_profiles
  console.log('Esperando creación del perfil...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Configurando datos del perfil como Vendedor...');
  const { error: profError } = await supabase
    .from('qui_profiles')
    .update({ 
        role: 'vendedor',
        is_active: true, // Activamos su participación
        username: 'jorge_vendedor', 
        full_name: 'Jorge Enríquez',
        referral_code: 'JORGE123'
    })
    .eq('id', userId);

  if (profError) {
    console.error('❌ Error actualizando el perfil:', profError.message);
    console.log('Nota: Si el error es "column role does not exist", recuerda ejecutar el ALTER TABLE en el SQL Editor de Supabase primero.');
  } else {
    console.log('✅ ¡Jorge Enríquez configurado con éxito como Vendedor! Código de referido: JORGE123');
  }
}

setupSeller();
