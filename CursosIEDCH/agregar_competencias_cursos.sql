-- Ejecutar este script en el editor SQL de Supabase para añadir el campo de competencias
ALTER TABLE public.ie_cursos ADD COLUMN IF NOT EXISTS competencias TEXT;
