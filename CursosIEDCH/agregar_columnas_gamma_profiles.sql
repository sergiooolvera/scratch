-- Agregar columna credits_used a ie_gamma_generations
ALTER TABLE public.ie_gamma_generations
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;

-- Agregar columnas para controlar el límite de generaciones de Gamma y las solicitudes de más intentos
ALTER TABLE public.ie_profiles
ADD COLUMN IF NOT EXISTS limite_generaciones_gamma INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS solicitud_mas_intentos_gamma BOOLEAN DEFAULT false;

-- Asegurar que los perfiles existentes tengan el límite de 3 si por alguna razón quedó nulo
UPDATE public.ie_profiles
SET limite_generaciones_gamma = 3
WHERE limite_generaciones_gamma IS NULL;
