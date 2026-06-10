-- Script para crear la tabla de Notificaciones

DROP TABLE IF EXISTS public.ie_notificaciones CASCADE;

CREATE TABLE public.ie_notificaciones (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES public.ie_profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.ie_profiles(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    enlace TEXT,
    leida BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.ie_notificaciones ENABLE ROW LEVEL SECURITY;

-- 1. Los administradores pueden ver y hacer todo
CREATE POLICY "Admins can do everything on notificaciones" 
ON public.ie_notificaciones 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ie_profiles 
    WHERE ie_profiles.id = auth.uid() AND ie_profiles.rol = 'admin'
  )
);

-- 2. Los usuarios pueden ver y modificar (leida/eliminar) SUS PROPIAS notificaciones
CREATE POLICY "Users can view their own notificaciones" 
ON public.ie_notificaciones 
FOR SELECT 
TO authenticated 
USING (usuario_id = auth.uid());

CREATE POLICY "Users can update their own notificaciones" 
ON public.ie_notificaciones 
FOR UPDATE
TO authenticated 
USING (usuario_id = auth.uid());

CREATE POLICY "Users can delete their own notificaciones" 
ON public.ie_notificaciones 
FOR DELETE
TO authenticated 
USING (usuario_id = auth.uid());

-- 3. Los usuarios autenticados pueden crear notificaciones (como actores)
CREATE POLICY "Users can insert notificaciones" 
ON public.ie_notificaciones 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Indexación para optimizar búsquedas por usuario_id y leida
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON public.ie_notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON public.ie_notificaciones(leida);

-- Habilitar Realtime para la tabla ie_notificaciones (Intenta añadir la tabla a la publicación existente)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ie_notificaciones;';
  ELSE
    EXECUTE 'CREATE PUBLICATION supabase_realtime FOR TABLE public.ie_notificaciones;';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Table might already be in publication
    RAISE NOTICE 'Error o tabla ya en publicación: %', SQLERRM;
END $$;
