-- Agregar campo pago_completo a ie_compras
-- Este campo indica si el alumno pagó el 100% del precio del curso
-- (sin cupón de descuento). Si es false, el alumno usó un cupón
-- y debe pagar la diferencia para obtener la constancia.

ALTER TABLE ie_compras 
ADD COLUMN IF NOT EXISTS pago_completo BOOLEAN DEFAULT false;

-- Actualizar los registros existentes: consideramos que los que ya están pagados
-- ya cubrieron el monto completo (retrocompatibilidad)
UPDATE ie_compras 
SET pago_completo = true 
WHERE pagado = true;
