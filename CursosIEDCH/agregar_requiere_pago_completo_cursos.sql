-- Agregar campo requiere_pago_completo a ie_cursos
-- Indica si el curso requiere que el alumno haya pagado el 100%
-- del valor para poder descargar la constancia.
-- Por default: false (no requiere)

ALTER TABLE ie_cursos 
ADD COLUMN IF NOT EXISTS requiere_pago_completo BOOLEAN DEFAULT false;
