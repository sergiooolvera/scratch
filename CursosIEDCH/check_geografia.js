const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkGeografia() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('[DEBUG] Buscando curso Geografia...');
  const { data: cursos, error: cErr } = await supabase
    .from('ie_cursos')
    .select('id, titulo, reunion_url, nota_profesor')
    .ilike('titulo', '%geografia%');

  if (cErr) return console.error('[ERROR CURSO]', cErr);
  if (!cursos || cursos.length === 0) return console.log('[INFO] No se encontró el curso Geografia.');

  for (const curso of cursos) {
    console.log(`\n--- [ID: ${curso.id}] ${curso.titulo} ---`);
    console.log(`Link: ${curso.reunion_url || 'NULO'}`);
    console.log(`Nota: ${curso.nota_profesor || 'NULA'}`);

    const { data: compras, error: pErr } = await supabase
      .from('ie_compras')
      .select('user_id, pagado')
      .eq('curso_id', curso.id);

    if (pErr) console.error('[ERROR COMPRAS]', pErr);
    console.log(`Total Alumnos: ${compras?.length || 0}`);
    console.log(`Pagados (true): ${compras?.filter(c => c.pagado === true).length || 0}`);

    // Verificar si el usuario 'sergio.olver@gmail.com' es uno de ellos
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
    const sergio = allUsers.find(u => u.email === 'sergio.olver@gmail.com');
    if (sergio) {
      const isSergioEnrolled = compras?.some(c => c.user_id === sergio.id && c.pagado === true);
      console.log(`¿Sergio Olvera está inscrito y pagado?: ${isSergioEnrolled ? 'SÍ' : 'NO'}`);
    }
  }
}

checkGeografia();
