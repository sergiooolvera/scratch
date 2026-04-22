const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetExam() {
  const email = 'sergio.olver@gmail.com';
  const courseTitle = 'Historia Mexicana';

  console.log(`Buscando usuario por email: ${email}`);
  
  // Use listUsers since it's the safest way to find by email with service role
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  
  if (uError) {
    console.error('Error listing users:', uError.message);
    return;
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log('No se encontró el usuario en Auth.');
    console.log('Usuarios disponibles:', users.map(u => u.email));
    return;
  }

  console.log(`Usuario encontrado ID: ${user.id}`);

  console.log(`Buscando curso: ${courseTitle}`);
  const { data: curso, error: cError } = await supabase
    .from('ie_cursos')
    .select('id, titulo')
    .ilike('titulo', `%${courseTitle}%`)
    .single();

  if (cError || !curso) {
    console.error('Curso no encontrado.');
    return;
  }

  console.log(`Curso encontrado: "${curso.titulo}" ID: ${curso.id}`);

  // Find exam ID
  const { data: exam, error: eError } = await supabase
    .from('ie_examenes')
    .select('id')
    .eq('curso_id', curso.id)
    .single();

  if (eError || !exam) {
    console.error('El curso no tiene un examen configurado.');
    return;
  }

  console.log(`Examen encontrado ID: ${exam.id}`);

  // Delete results from ie_resultados_examenes
  console.log('Eliminando resultados previos...');
  const { error: dError } = await supabase
    .from('ie_resultados_examenes')
    .delete()
    .eq('user_id', user.id)
    .eq('examen_id', exam.id);

  if (dError) {
    console.error('Error al eliminar resultados:', dError.message);
    return;
  }

  // Also might need to delete from ie_certificados if any
  console.log('Eliminando certificados previos (si los hay)...');
  await supabase
    .from('ie_certificados')
    .delete()
    .eq('id_usuario', user.id)
    .eq('id_curso', curso.id);

  console.log('¡Éxito! El examen ha sido reseteado para el usuario.');
}

resetExam();
