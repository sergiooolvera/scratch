-- Script para crear la tabla de Preguntas y Respuestas (Q&A)

CREATE TABLE IF NOT EXISTS public.ie_preguntas_respuestas (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    curso_id UUID REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    respuesta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.ie_preguntas_respuestas ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)

-- 1. Los administradores pueden ver y hacer todo
CREATE POLICY "Admins can do everything on preguntas" 
ON public.ie_preguntas_respuestas 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ie_profiles 
    WHERE ie_profiles.id = auth.uid() AND ie_profiles.rol = 'admin'
  )
);

-- 2. Los alumnos pueden ver SUS PROPIAS preguntas en un curso
CREATE POLICY "Users can view their own preguntas" 
ON public.ie_preguntas_respuestas 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 3. Los alumnos pueden hacer nuevas preguntas (INSERT)
CREATE POLICY "Users can insert their own preguntas" 
ON public.ie_preguntas_respuestas 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- NOTA: Como la tabla 'ie_cursos' asocia instructores a cada curso, 
-- los instructores que no son admins no tienen una política sencilla aquí sin hacer un join.
-- En este proyecto utilizaremos el SDK de Admin / Service Role para las APIs del profesor 
-- encargadas de leer y responder las dudas para evitar RLS complejos, o crearemos una API privada.

-- Indexación para optimizar búsquedas por curso y usuario
CREATE INDEX IF NOT EXISTS idx_preguntas_curso ON public.ie_preguntas_respuestas(curso_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_user ON public.ie_preguntas_respuestas(user_id);
