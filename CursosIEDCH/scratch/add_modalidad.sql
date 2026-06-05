-- Agregar columnas de modalidad a cursos
ALTER TABLE ie_cursos ADD COLUMN IF NOT EXISTS modalidad text DEFAULT 'abierta';
ALTER TABLE ie_cursos ADD COLUMN IF NOT EXISTS limite_inscripcion date;

-- Migrar roles en ie_profiles (para que se pueda ver "mis ventas" y coincidan las nuevas reglas)
UPDATE ie_profiles SET rol = 'capacitador' WHERE rol = 'instructor';
UPDATE ie_profiles SET rol = 'instructor' WHERE rol = 'profesor';
