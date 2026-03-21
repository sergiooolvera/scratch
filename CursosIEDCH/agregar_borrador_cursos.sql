-- Script para añadir columna de borrador a la tabla de cursos
ALTER TABLE ie_cursos 
ADD COLUMN cambios_pendientes JSONB;
