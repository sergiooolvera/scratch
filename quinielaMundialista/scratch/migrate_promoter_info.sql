-- Migration: Crear tabla qui_promoter_info
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS public.qui_promoter_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.qui_profiles(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '',
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    code_expires_at TIMESTAMP WITH TIME ZONE,
    clabe TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.qui_promoter_info ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own promoter info" ON public.qui_promoter_info;
CREATE POLICY "Users can view their own promoter info" 
  ON public.qui_promoter_info FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own promoter info" ON public.qui_promoter_info;
CREATE POLICY "Users can insert their own promoter info" 
  ON public.qui_promoter_info FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own promoter info" ON public.qui_promoter_info;
CREATE POLICY "Users can update their own promoter info" 
  ON public.qui_promoter_info FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all promoter info" ON public.qui_promoter_info;
CREATE POLICY "Admins can view all promoter info" 
  ON public.qui_promoter_info FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.qui_profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Grants
GRANT ALL ON public.qui_promoter_info TO authenticated;
GRANT ALL ON public.qui_promoter_info TO service_role;
