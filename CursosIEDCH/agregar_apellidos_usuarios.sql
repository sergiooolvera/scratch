-- Script para añadir columnas de apellidos a la tabla de perfiles
ALTER TABLE ie_profiles 
ADD COLUMN apellido_paterno TEXT,
ADD COLUMN apellido_materno TEXT;
