-- ============================================================
-- FIX: "Database error saving new user" en el registro
-- ============================================================
-- El error ocurre porque el trigger handle_new_user en la base
-- de datos está desactualizado o faltante. Ejecuta este script
-- completo en el SQL Editor de Supabase.
-- ============================================================

-- 1. Recrear la función del trigger con todos los campos actuales
--    NOTA: ie_profiles NO tiene columna "email", se omite.
--    "nombre" es NOT NULL sin default — hay que usar COALESCE.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.ie_profiles (
    id, 
    nombre, 
    apellido_paterno, 
    apellido_materno, 
    rol,
    activo
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nombre', ''),
    COALESCE(new.raw_user_meta_data->>'apellido_paterno', ''),
    new.raw_user_meta_data->>'apellido_materno',
    'alumno',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;

-- 2. Asegurarse de que el trigger existe y apunta a la función actualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICACIÓN: corre este SELECT para confirmar que el trigger existe
-- ============================================================
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_schema = 'auth'
--   AND event_object_table = 'users';
