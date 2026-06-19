-- Agregar columna 'titulo' a la tabla 'ie_gamma_generations' para almacenar el título personalizado
ALTER TABLE public.ie_gamma_generations ADD COLUMN IF NOT EXISTS titulo TEXT;
