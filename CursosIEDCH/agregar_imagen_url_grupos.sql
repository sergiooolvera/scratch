-- Migración: Agregar columna imagen_url a la tabla ie_grupos
ALTER TABLE public.ie_grupos ADD COLUMN IF NOT EXISTS imagen_url text;
