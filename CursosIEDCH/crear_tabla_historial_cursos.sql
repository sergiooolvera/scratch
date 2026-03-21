-- Historial de Cambios en Cursos
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.ie_curso_historial (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    curso_id UUID REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    modificado_por UUID REFERENCES public.ie_profiles(id) ON DELETE SET NULL,
    detalles_cambio TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Politicas RLS
ALTER TABLE public.ie_curso_historial ENABLE ROW LEVEL SECURITY;

-- Los profesores solo pueden ver el historial de sus propios cursos
CREATE POLICY "Profesor_Select_Historial" ON public.ie_curso_historial
FOR SELECT
USING (
  curso_id IN (
    SELECT id FROM public.ie_cursos WHERE creado_por = auth.uid()
  )
);

-- Los profesores pueden insertar historial para sus cursos
CREATE POLICY "Profesor_Insert_Historial" ON public.ie_curso_historial
FOR INSERT
WITH CHECK (
  curso_id IN (
    SELECT id FROM public.ie_cursos WHERE creado_por = auth.uid()
  )
);

-- Los admins pueden ver todo
CREATE POLICY "Admin_Select_Historial" ON public.ie_curso_historial
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin')
);
