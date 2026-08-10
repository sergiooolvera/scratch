require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USERS = [
  {
    email: 'e2e_alumno@iedch.edu.mx',
    password: 'Password123!',
    nombre: 'Alumno E2E Test',
    rol: 'alumno'
  },
  {
    email: 'e2e_profesor@iedch.edu.mx',
    password: 'Password123!',
    nombre: 'Profesor E2E Test',
    rol: 'instructor'
  },
  {
    email: 'e2e_admin@iedch.edu.mx',
    password: 'Password123!',
    nombre: 'Admin E2E Test',
    rol: 'admin'
  }
];

async function seedTestUsers() {
  console.log('--- Creando / Verificando usuarios de prueba para E2E ---');

  for (const userSpec of TEST_USERS) {
    try {
      // Verificar si el usuario ya existe en Supabase Auth
      const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
      
      let existingUser = null;
      if (!listErr && usersList && usersList.users) {
        existingUser = usersList.users.find(u => u.email === userSpec.email);
      }

      let userId;

      if (existingUser) {
        console.log(`[EXISTE] Usuario ${userSpec.email} (ID: ${existingUser.id})`);
        userId = existingUser.id;

        // Actualizar la contraseña por si cambió
        const { error: updatePassErr } = await supabase.auth.admin.updateUserById(userId, {
          password: userSpec.password,
          user_metadata: { nombre: userSpec.nombre }
        });
        if (updatePassErr) {
          console.warn(`[WARN] No se pudo actualizar contraseña de ${userSpec.email}: ${updatePassErr.message}`);
        }
      } else {
        console.log(`[CREANDO] Usuario ${userSpec.email}...`);
        const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
          email: userSpec.email,
          password: userSpec.password,
          email_confirm: true,
          user_metadata: { nombre: userSpec.nombre }
        });

        if (createErr) {
          console.error(`[ERROR] Falló al crear ${userSpec.email}: ${createErr.message}`);
          continue;
        }
        userId = createData.user.id;
        console.log(`[CREADO] Usuario ${userSpec.email} creado con ID: ${userId}`);
      }

      // Asegurar perfil en ie_profiles
      const { error: profileErr } = await supabase
        .from('ie_profiles')
        .upsert({
          id: userId,
          nombre: userSpec.nombre,
          rol: userSpec.rol
        }, { onConflict: 'id' });

      if (profileErr) {
        console.error(`[ERROR] Falló al asignar rol ${userSpec.rol} en ie_profiles: ${profileErr.message}`);
      } else {
        console.log(`[ROL OK] Rol '${userSpec.rol}' asignado correctamente a ${userSpec.email}`);
      }
    } catch (err) {
      console.error(`[EXCEPCION] ${userSpec.email}:`, err);
    }
  }

  console.log('--- Proceso de usuarios de prueba E2E completado ---');
}

seedTestUsers();
