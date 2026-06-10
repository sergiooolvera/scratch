-- Script para solucionar el error de Row Level Security (RLS) en ie_modulo_recursos

-- Asegurar que RLS esté habilitado
ALTER TABLE public.ie_modulo_recursos ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes por si acaso
DROP POLICY IF EXISTS "Permitir lectura a todos" ON public.ie_modulo_recursos;
DROP POLICY IF EXISTS "Permitir inserción a autenticados" ON public.ie_modulo_recursos;
DROP POLICY IF EXISTS "Permitir actualización a autenticados" ON public.ie_modulo_recursos;
DROP POLICY IF EXISTS "Permitir borrado a autenticados" ON public.ie_modulo_recursos;

-- 1. Permitir que cualquier usuario autenticado (alumno o profesor) pueda LEER (SELECT)
CREATE POLICY "Permitir lectura a autenticados"
ON public.ie_modulo_recursos FOR SELECT
TO authenticated
USING (true);

-- 2. Permitir que usuarios autenticados (profesores) puedan INSERTAR
CREATE POLICY "Permitir inserción a autenticados"
ON public.ie_modulo_recursos FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Permitir que usuarios autenticados (profesores) puedan ACTUALIZAR
CREATE POLICY "Permitir actualización a autenticados"
ON public.ie_modulo_recursos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Permitir que usuarios autenticados (profesores) puedan ELIMINAR
CREATE POLICY "Permitir borrado a autenticados"
ON public.ie_modulo_recursos FOR DELETE
TO authenticated
USING (true);
