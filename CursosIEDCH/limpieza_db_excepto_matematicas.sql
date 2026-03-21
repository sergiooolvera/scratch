-- Script para borrar todos los cursos, compras y constancias EXCEPTO el curso MATEMATICAS
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
    v_curso_id uuid;
BEGIN
    -- 1. Buscar el ID del curso MATEMATICAS
    SELECT id INTO v_curso_id FROM ie_cursos WHERE titulo ILIKE '%MATEMATICAS%' LIMIT 1;
    
    IF v_curso_id IS NULL THEN
        RAISE EXCEPTION 'No se encontro el curso MATEMATICAS. Abortando limpieza para evitar borrar todo.';
        RETURN;
    END IF;

    RAISE NOTICE 'Manteniendo el curso % (%s)', v_curso_id, 'MATEMATICAS';

    -- 2. Borrar certificados/resultados de intentos de examen (relacionado a constancias)
    DELETE FROM ie_resultados_examenes 
    WHERE examen_id IN (SELECT id FROM ie_examenes_usuario WHERE curso_id != v_curso_id);

    -- 3. Borrar constancias generales (ie_examenes_usuario)
    DELETE FROM ie_examenes_usuario WHERE curso_id != v_curso_id;

    -- 4. Borrar Q&A
    DELETE FROM ie_preguntas_respuestas WHERE curso_id != v_curso_id;

    -- 5. Borrar compras asociadas
    DELETE FROM ie_compras WHERE curso_id != v_curso_id;

    -- 6. Borrar preguntas de examenes
    DELETE FROM ie_preguntas 
    WHERE examen_id IN (SELECT id FROM ie_examenes WHERE curso_id != v_curso_id);

    -- 7. Borrar los examenes
    DELETE FROM ie_examenes WHERE curso_id != v_curso_id;

    -- 8. Borrar modulos
    DELETE FROM ie_curso_modulos WHERE curso_id != v_curso_id;

    -- 9. Finalmente, borrar los cursos
    DELETE FROM ie_cursos WHERE id != v_curso_id;

    RAISE NOTICE 'Limpieza de base de datos completada.';
END $$;
