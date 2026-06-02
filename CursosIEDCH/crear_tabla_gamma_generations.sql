-- Crear tabla para almacenar el registro de presentaciones generadas con Gamma API
CREATE TABLE IF NOT EXISTS public.ie_gamma_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.ie_cursos(id) ON DELETE SET NULL,
    modulo_id UUID REFERENCES public.ie_curso_modulos(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    num_slides INTEGER NOT NULL DEFAULT 10,
    formato VARCHAR(10) NOT NULL, -- 'pdf' o 'pptx'
    gamma_url TEXT,
    export_url TEXT,
    descargado BOOLEAN DEFAULT false,
    utilizado BOOLEAN DEFAULT false,
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar seguridad de nivel de fila (RLS)
ALTER TABLE public.ie_gamma_generations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios autenticados operen solo en sus registros
DROP POLICY IF EXISTS gamma_generations_policy ON public.ie_gamma_generations;
CREATE POLICY gamma_generations_policy ON public.ie_gamma_generations
    FOR ALL
    TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Crear índice para optimizar la búsqueda y conteo por perfil
CREATE INDEX IF NOT EXISTS idx_ie_gamma_generations_profile_id ON public.ie_gamma_generations(profile_id);
