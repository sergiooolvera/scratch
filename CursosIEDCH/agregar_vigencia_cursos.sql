-- Agregar columna vigencia_anos a ie_cursos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE ie_cursos
ADD COLUMN IF NOT EXISTS vigencia_anos INT NOT NULL DEFAULT 3;

-- Verificar que se agregó correctamente
SELECT id, titulo, vigencia_anos FROM ie_cursos LIMIT 10;
