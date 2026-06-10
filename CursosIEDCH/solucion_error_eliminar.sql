-- Eliminar la restricción actual
ALTER TABLE ie_cursos DROP CONSTRAINT IF EXISTS ie_cursos_estado_check;

-- Volver a crear la restricción agregando 'eliminado' como estado válido
ALTER TABLE ie_cursos ADD CONSTRAINT ie_cursos_estado_check 
CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'borrador', 'eliminado'));
