-- ⚠️ SCRIPT DEFINITIVO PARA CREAR LA TABLA DE PREGUNTAS Y RESPUESTAS ⚠️
-- Ejecuta esto en Supabase > SQL Editor

-- 1. Si la tabla ya existe (por si acaso hubo un error previo), la eliminamos para empezar limpios
DROP TABLE IF EXISTS public.ie_preguntas_respuestas CASCADE;

-- 2. Creamos la tabla con gen_random_uuid() (el estándar más seguro de Supabase)
CREATE TABLE public.ie_preguntas_respuestas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id UUID REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    respuesta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE
);

-- 3. Habilitamos Row Level Security (RLS)
ALTER TABLE public.ie_preguntas_respuestas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS)

-- Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything on preguntas" 
ON public.ie_preguntas_respuestas 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ie_profiles 
    WHERE ie_profiles.id = auth.uid() AND ie_profiles.rol = 'admin'
  )
);

-- Los alumnos pueden VER sus propias preguntas
CREATE POLICY "Users can view their own preguntas" 
ON public.ie_preguntas_respuestas 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Los alumnos pueden INSERTAR sus propias preguntas
CREATE POLICY "Users can insert their own preguntas" 
ON public.ie_preguntas_respuestas 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 5. IMPORTANTE: En Supabase a veces se necesita dar permisos explícitos al rol 'authenticated'
GRANT ALL ON TABLE public.ie_preguntas_respuestas TO authenticated;
GRANT ALL ON TABLE public.ie_preguntas_respuestas TO service_role;

-- 6. Índices para mayor velocidad
CREATE INDEX IF NOT EXISTS idx_preguntas_curso ON public.ie_preguntas_respuestas(curso_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_user ON public.ie_preguntas_respuestas(user_id);
