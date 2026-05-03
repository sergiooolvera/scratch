
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompras() {
  const emails = ['sergio.olver@gmail.com', 'sanchezjahir740@gmail.com', 'esmecflores_267@hotmail.com'];
  
  // Obtener IDs de perfiles por nombre (ya que no hay email en ie_profiles)
  // O mejor, buscamos en ie_compras y filtramos por los nombres conocidos
  const { data: profiles } = await supabase
    .from('ie_profiles')
    .select('id, nombre, apellido_paterno')
    .or('nombre.ilike.%Sergio%,nombre.ilike.%Jahir%,nombre.ilike.%Esmeralda%');

  const profileMap = {};
  const userIds = [];
  profiles.forEach(p => {
    profileMap[p.id] = `${p.nombre || ''} ${p.apellido_paterno || ''}`.trim();
    userIds.push(p.id);
  });

  const { data: compras } = await supabase
    .from('ie_compras')
    .select('id, user_id, curso_id, fecha_compra, referred_by')
    .in('user_id', userIds)
    .order('fecha_compra', { ascending: false });

  const { data: cursos } = await supabase
    .from('ie_cursos')
    .select('id, titulo');
  
  const cursoMap = {};
  cursos.forEach(c => cursoMap[c.id] = c.titulo);

  console.log('--- COMPRAS EN BD PARA SERGIO, JAHIR Y ESMERALDA ---');
  compras.forEach(c => {
    console.log(`ID: ${c.id} | Usuario: ${profileMap[c.user_id]} | Curso: ${cursoMap[c.curso_id]} | Fecha: ${c.fecha_compra} | Ref: ${c.referred_by || 'Ninguno'}`);
  });
}

checkCompras();
