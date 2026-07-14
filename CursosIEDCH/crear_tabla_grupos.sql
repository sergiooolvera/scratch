-- Eliminar tablas si existen para recreación limpia
DROP TABLE IF EXISTS public.ie_grupo_cursos CASCADE;
DROP TABLE IF EXISTS public.ie_grupo_alumnos CASCADE;
DROP TABLE IF EXISTS public.ie_grupos CASCADE;

-- 1. Crear tabla de grupos
CREATE TABLE IF NOT EXISTS public.ie_grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academia_id UUID NOT NULL REFERENCES public.ie_academias(id) ON DELETE CASCADE,
    creado_por UUID NOT NULL REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS en ie_grupos
ALTER TABLE public.ie_grupos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ie_grupos
CREATE POLICY "Permitir lectura publica de grupos"
    ON public.ie_grupos FOR SELECT USING (true);

CREATE POLICY "Permitir creacion de grupos a usuarios autenticados"
    ON public.ie_grupos FOR INSERT WITH CHECK (auth.uid() = creado_por);

CREATE POLICY "Permitir modificacion de grupos a sus creadores"
    ON public.ie_grupos FOR UPDATE USING (auth.uid() = creado_por) WITH CHECK (auth.uid() = creado_por);

CREATE POLICY "Permitir eliminacion de grupos a sus creadores"
    ON public.ie_grupos FOR DELETE USING (auth.uid() = creado_por);

-- 2. Crear tabla intermedia de cursos asignados a grupos
CREATE TABLE IF NOT EXISTS public.ie_grupo_cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES public.ie_grupos(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_grupo_curso UNIQUE (grupo_id, curso_id)
);

-- Habilitar RLS en ie_grupo_cursos
ALTER TABLE public.ie_grupo_cursos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ie_grupo_cursos
CREATE POLICY "Permitir lectura publica de grupo_cursos"
    ON public.ie_grupo_cursos FOR SELECT USING (true);

CREATE POLICY "Permitir creacion de grupo_cursos a creadores del grupo"
    ON public.ie_grupo_cursos FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ie_grupos g 
            WHERE g.id = grupo_id AND g.creado_por = auth.uid()
        )
    );

CREATE POLICY "Permitir eliminacion de grupo_cursos a creadores del grupo"
    ON public.ie_grupo_cursos FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ie_grupos g 
            WHERE g.id = grupo_id AND g.creado_por = auth.uid()
        )
    );

-- 3. Crear tabla intermedia de alumnos de grupos
CREATE TABLE IF NOT EXISTS public.ie_grupo_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES public.ie_grupos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_grupo_alumno UNIQUE (grupo_id, user_id)
);

-- Habilitar RLS en ie_grupo_alumnos
ALTER TABLE public.ie_grupo_alumnos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ie_grupo_alumnos
CREATE POLICY "Permitir lectura publica de grupo_alumnos"
    ON public.ie_grupo_alumnos FOR SELECT USING (true);

CREATE POLICY "Permitir creacion de grupo_alumnos a creadores del grupo"
    ON public.ie_grupo_alumnos FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ie_grupos g 
            WHERE g.id = grupo_id AND g.creado_por = auth.uid()
        )
    );

CREATE POLICY "Permitir eliminacion de grupo_alumnos a creadores del grupo"
    ON public.ie_grupo_alumnos FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ie_grupos g 
            WHERE g.id = grupo_id AND g.creado_por = auth.uid()
        )
    );

-- =========================================================================
-- ÍNDICES DE RENDIMIENTO (Requisito de optimización del proyecto)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_ie_grupos_academia_id ON public.ie_grupos(academia_id);
CREATE INDEX IF NOT EXISTS idx_ie_grupos_creado_por ON public.ie_grupos(creado_por);

CREATE INDEX IF NOT EXISTS idx_ie_grupo_cursos_grupo_id ON public.ie_grupo_cursos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_ie_grupo_cursos_curso_id ON public.ie_grupo_cursos(curso_id);

CREATE INDEX IF NOT EXISTS idx_ie_grupo_alumnos_grupo_id ON public.ie_grupo_alumnos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_ie_grupo_alumnos_user_id ON public.ie_grupo_alumnos(user_id);
