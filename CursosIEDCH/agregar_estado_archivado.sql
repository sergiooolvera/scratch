-- Migración: Agregar estado 'archivado' a la restricción ie_cursos_estado_check

-- Eliminar la restricción actual de ie_cursos_estado_check
ALTER TABLE public.ie_cursos DROP CONSTRAINT IF EXISTS ie_cursos_estado_check;

-- Volver a crear la restricción agregando 'archivado' como estado válido
ALTER TABLE public.ie_cursos ADD CONSTRAINT ie_cursos_estado_check 
CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'borrador', 'eliminado', 'archivado'));

-- Índice de rendimiento para filtrar por estado rápidamente (Regla de optimización de BD)
CREATE INDEX IF NOT EXISTS idx_ie_cursos_estado ON public.ie_cursos(estado);
