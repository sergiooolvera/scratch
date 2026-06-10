-- Script para agregar cuestionarios modulares con preguntas abiertas

-- 1. Agregar campo en ie_curso_modulos
ALTER TABLE public.ie_curso_modulos
ADD COLUMN IF NOT EXISTS requiere_cuestionario BOOLEAN DEFAULT FALSE;

-- 2. Tabla de Preguntas del Cuestionario
CREATE TABLE IF NOT EXISTS public.ie_cuestionario_preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo_id UUID NOT NULL REFERENCES public.ie_curso_modulos(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.ie_cuestionario_preguntas ENABLE ROW LEVEL SECURITY;

-- Políticas para ie_cuestionario_preguntas
CREATE POLICY "Admins y Profesores pueden hacer todo en preguntas de cuestionario" 
ON public.ie_cuestionario_preguntas 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.ie_profiles 
    WHERE id = auth.uid() AND rol IN ('admin', 'profesor')
  )
);

CREATE POLICY "Cualquier usuario autenticado puede ver las preguntas" 
ON public.ie_cuestionario_preguntas 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. Tabla de Respuestas del Cuestionario
CREATE TABLE IF NOT EXISTS public.ie_cuestionario_respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregunta_id UUID NOT NULL REFERENCES public.ie_cuestionario_preguntas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    respuesta TEXT NOT NULL,
    calificacion VARCHAR(50), -- "Excelente", "Buena", "Regular", "Area de Oportunidad"
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(pregunta_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.ie_cuestionario_respuestas ENABLE ROW LEVEL SECURITY;

-- Políticas para ie_cuestionario_respuestas
CREATE POLICY "Admins y Profesores pueden hacer todo en respuestas de cuestionario" 
ON public.ie_cuestionario_respuestas 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.ie_profiles 
    WHERE id = auth.uid() AND rol IN ('admin', 'profesor')
  )
);

CREATE POLICY "Usuarios pueden ver sus propias respuestas" 
ON public.ie_cuestionario_respuestas 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden insertar sus propias respuestas" 
ON public.ie_cuestionario_respuestas 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propias respuestas si no tienen calificacion" 
ON public.ie_cuestionario_respuestas 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid() AND calificacion IS NULL);

-- Indices
CREATE INDEX IF NOT EXISTS idx_cuestionario_preguntas_modulo ON public.ie_cuestionario_preguntas(modulo_id);
CREATE INDEX IF NOT EXISTS idx_cuestionario_respuestas_pregunta ON public.ie_cuestionario_respuestas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_cuestionario_respuestas_user ON public.ie_cuestionario_respuestas(user_id);
