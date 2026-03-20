-- Copia y pega esto en el SQL Editor de Supabase
-- Explicación: Borra de ie_cursos todos los registros cuyo ID no esté dentro
-- de los 3 últimos creados (ordenados por created_at descendente).

DELETE FROM public.ie_cursos
WHERE id NOT IN (
    SELECT id 
    FROM public.ie_cursos 
    ORDER BY created_at DESC 
    LIMIT 3
);

-- Nota: Si ie_cursos tiene relaciones con otras tablas (como ie_compras, ie_lecciones)
-- y no tienes activado "ON DELETE CASCADE", podría arrojar un error de llave foránea.
-- Asegúrate de que borrar un curso pueda borrar sus dependencias en cascada, 
-- o borra las dependencias primero si es necesario.
