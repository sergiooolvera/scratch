-- Agregar columna para controlar si se muestra la calificación en la constancia
ALTER TABLE ie_cursos ADD COLUMN IF NOT EXISTS mostrar_calificacion_constancia BOOLEAN DEFAULT true;
