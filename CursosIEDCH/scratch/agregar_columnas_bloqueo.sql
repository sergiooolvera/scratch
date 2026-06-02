-- Add columns to ie_cursos table for blocking module progression
ALTER TABLE ie_cursos ADD COLUMN IF NOT EXISTS bloquear_avance BOOLEAN DEFAULT false;
ALTER TABLE ie_cursos ADD COLUMN IF NOT EXISTS requiere_tareas_avance BOOLEAN DEFAULT false;
ALTER TABLE ie_cursos ADD COLUMN IF NOT EXISTS requiere_examen_avance BOOLEAN DEFAULT false;
