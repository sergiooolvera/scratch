-- =========================================================================
-- MIGRACIÓN DE BASE DE DATOS - RÉGIMEN FISCAL Y AUTORIZACIÓN (2026)
-- =========================================================================

-- 1. Agregar columnas a ie_profiles
ALTER TABLE public.ie_profiles
    ADD COLUMN IF NOT EXISTS regimen_fiscal text NOT NULL DEFAULT 'sin_rfc',
    ADD COLUMN IF NOT EXISTS regimen_fiscal_solicitado text,
    ADD COLUMN IF NOT EXISTS regimen_fiscal_estado text NOT NULL DEFAULT 'aprobado',
    ADD COLUMN IF NOT EXISTS regimen_fiscal_motivo_rechazo text,
    ADD COLUMN IF NOT EXISTS regimen_fiscal_actualizado_at timestamp with time zone DEFAULT now();

-- 2. Restricciones CHECK de integridad
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ie_profiles_regimen_fiscal_check'
    ) THEN
        ALTER TABLE public.ie_profiles
            ADD CONSTRAINT ie_profiles_regimen_fiscal_check 
            CHECK (regimen_fiscal IN ('sin_rfc', 'con_rfc', 'persona_moral'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ie_profiles_regimen_fiscal_solicitado_check'
    ) THEN
        ALTER TABLE public.ie_profiles
            ADD CONSTRAINT ie_profiles_regimen_fiscal_solicitado_check 
            CHECK (regimen_fiscal_solicitado IS NULL OR regimen_fiscal_solicitado IN ('sin_rfc', 'con_rfc', 'persona_moral'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ie_profiles_regimen_fiscal_estado_check'
    ) THEN
        ALTER TABLE public.ie_profiles
            ADD CONSTRAINT ie_profiles_regimen_fiscal_estado_check 
            CHECK (regimen_fiscal_estado IN ('aprobado', 'pendiente', 'rechazado'));
    END IF;
END $$;

-- 3. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_ie_profiles_regimen_fiscal ON public.ie_profiles(regimen_fiscal);
CREATE INDEX IF NOT EXISTS idx_ie_profiles_regimen_estado ON public.ie_profiles(regimen_fiscal_estado);
