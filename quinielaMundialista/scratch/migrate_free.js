const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateFree() {
  console.log('Iniciando migración para activar todos los perfiles...');
  
  // Actualizar todos los registros existentes a is_active = true
  const { data, error, count } = await supabase
    .from('qui_profiles')
    .update({ is_active: true })
    .neq('is_active', true)
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Error al actualizar perfiles existentes:', error.message);
  } else {
    console.log(`✅ ¡Éxito! Se actualizaron ${count || 0} perfiles a is_active = true.`);
  }

  console.log('\n--- QUERY SQL PARA CORRER EN EL PANEL DE SUPABASE ---');
  console.log('Por favor copia y ejecuta el siguiente bloque SQL en el "SQL Editor" de tu panel de Supabase para actualizar la estructura de la base de datos de forma permanente:');
  console.log(`
-- 1. Cambiar valor por defecto de is_active a true para futuras cuentas
ALTER TABLE public.qui_profiles ALTER COLUMN is_active SET DEFAULT TRUE;

-- 2. Actualizar la función trigger para que cree nuevas cuentas activas por default
CREATE OR REPLACE FUNCTION public.handle_new_user_quiniela()
RETURNS trigger AS $$
DECLARE
  ref_code TEXT;
  ref_by_id UUID;
BEGIN
  ref_code := UPPER(substring(new.id::text from 1 for 8));
  
  IF new.raw_user_meta_data->>'referral_code_used' IS NOT NULL THEN
    SELECT id INTO ref_by_id 
    FROM public.qui_profiles 
    WHERE referral_code = UPPER(TRIM(new.raw_user_meta_data->>'referral_code_used'))
    LIMIT 1;
  END IF;

  INSERT INTO public.qui_profiles (id, username, full_name, avatar_url, is_admin, is_active, referral_code, referred_by)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    FALSE,
    TRUE, -- Activo por default
    ref_code,
    ref_by_id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Asegurar que todos los usuarios existentes estén activos
UPDATE public.qui_profiles SET is_active = TRUE;
  `);
}

migrateFree();
