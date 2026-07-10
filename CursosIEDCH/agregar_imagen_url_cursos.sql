-- Migración: Agregar columna imagen_url a la tabla ie_cursos
ALTER TABLE public.ie_cursos ADD COLUMN IF NOT EXISTS imagen_url text;
