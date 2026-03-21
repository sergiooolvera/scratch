-- Script para agregar borrado logico a usuarios
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.ie_profiles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
