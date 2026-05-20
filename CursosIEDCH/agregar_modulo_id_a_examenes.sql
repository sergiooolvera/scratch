-- ====================================================================
-- MIGRACIÓN DE BASE DE DATOS: EXÁMENES MODULARES
-- ====================================================================
-- Instrucciones: Copia y ejecuta este código en el editor de SQL
-- de tu panel de control de Supabase (https://supabase.com).
-- ====================================================================

-- 1. Agregar la columna modulo_id a la tabla de exámenes.
-- Hace referencia a ie_curso_modulos y tiene borrado en cascada.
ALTER TABLE public.ie_examenes
  ADD COLUMN IF NOT EXISTS modulo_id UUID REFERENCES public.ie_curso_modulos(id) ON DELETE CASCADE;

-- 2. Crear un índice optimizado para acelerar las búsquedas de exámenes 
-- asociados a módulos específicos.
CREATE INDEX IF NOT EXISTS idx_ie_examenes_modulo_id ON public.ie_examenes(modulo_id);

-- 3. Mensaje de confirmación
SELECT 'Migración completada exitosamente: Columna modulo_id agregada e indexada en ie_examenes.' AS resultado;
