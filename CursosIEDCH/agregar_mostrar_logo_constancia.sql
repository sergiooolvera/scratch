-- Agregar columna para controlar si se muestra el logo de la institución en la constancia
ALTER TABLE ie_cursos ADD COLUMN IF NOT EXISTS mostrar_logo_constancia BOOLEAN DEFAULT true;
