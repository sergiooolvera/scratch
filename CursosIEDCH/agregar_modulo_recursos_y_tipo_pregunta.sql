-- 1. Crear tabla para almacenar múltiples recursos por módulo
CREATE TABLE IF NOT EXISTS public.ie_modulo_recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo_id UUID NOT NULL REFERENCES public.ie_curso_modulos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    url_contenido TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índice para acelerar las búsquedas por modulo_id
CREATE INDEX IF NOT EXISTS idx_ie_modulo_recursos_modulo_id ON public.ie_modulo_recursos(modulo_id);

-- 2. Migrar recursos individuales existentes de ie_curso_modulos a la nueva tabla
INSERT INTO public.ie_modulo_recursos (modulo_id, titulo, url_contenido, orden)
SELECT id, 'Material del Módulo', url_contenido, 1
FROM public.ie_curso_modulos
WHERE url_contenido IS NOT NULL AND url_contenido <> ''
ON CONFLICT DO NOTHING;

-- 3. Agregar tipo_pregunta a la tabla de preguntas
ALTER TABLE public.ie_preguntas
  ADD COLUMN IF NOT EXISTS tipo_pregunta VARCHAR(30) NOT NULL DEFAULT 'opcion_multiple';
