-- Migración para añadir la columna mostrar_revision_examen a la tabla ie_cursos
ALTER TABLE public.ie_cursos ADD COLUMN IF NOT EXISTS mostrar_revision_examen BOOLEAN DEFAULT false;
