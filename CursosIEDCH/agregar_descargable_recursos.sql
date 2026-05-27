-- Añadir la columna 'descargable' a la tabla 'ie_modulo_recursos' con valor por defecto false
ALTER TABLE public.ie_modulo_recursos ADD COLUMN IF NOT EXISTS descargable BOOLEAN DEFAULT false;
