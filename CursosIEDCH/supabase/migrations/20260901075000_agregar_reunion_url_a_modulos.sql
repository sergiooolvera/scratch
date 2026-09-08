-- Migración: Agregar campos de clase virtual / videoconferencia a ie_curso_modulos
ALTER TABLE public.ie_curso_modulos 
ADD COLUMN IF NOT EXISTS reunion_url text,
ADD COLUMN IF NOT EXISTS nota_profesor text;

-- Índice para optimizar consultas de módulos que tienen clase virtual o videoconferencia configurada
CREATE INDEX IF NOT EXISTS idx_ie_curso_modulos_reunion_url 
ON public.ie_curso_modulos (reunion_url) 
WHERE reunion_url IS NOT NULL;
