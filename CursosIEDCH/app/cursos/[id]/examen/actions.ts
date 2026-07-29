'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function submitExamen(cursoId: string, respuestasUsuario: Record<string, string>, explicaciones: Record<string, string>, bloqueadoPorSeguridad: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    // 1. Fetch the exam and correct answers securely on the server
    const { data: examen, error: exmError } = await supabase
        .from('ie_examenes')
        .select('id, min_aprobacion')
        .eq('curso_id', cursoId)
        .is('modulo_id', null)
        .single()

    if (exmError || !examen) {
        return { error: 'Examen no encontrado en la base de datos' }
    }

    // Fetch full question data including all options to convert user's text answer → letter
    const { data: preguntas, error: pregError } = await supabase
        .from('ie_preguntas')
        .select('id, respuesta_correcta, opcion_a, opcion_b, opcion_c, opcion_d, tipo_pregunta')
        .eq('examen_id', examen.id)

    if (pregError || !preguntas || preguntas.length === 0) {
        return { error: 'No se encontraron las preguntas del examen' }
    }

    // 2. Grade the exam
    let correctas = 0;
    const preguntasMultipleChoice = preguntas.filter(p => p.tipo_pregunta !== 'respuesta_libre');
    const totalMultipleChoice = preguntasMultipleChoice.length;
    const divisor = totalMultipleChoice > 0 ? totalMultipleChoice : (preguntas.length > 0 ? preguntas.length : 1);
    const respuestasDetalle: Record<string, { respuesta: string, respuesta_texto: string, explicacion: string, correcta: boolean }> = {};

    preguntas.forEach(p => {
        const userAnsText = respuestasUsuario[p.id];
        const explicacion = explicaciones[p.id] || '';
        if (!userAnsText) return;

        let esCorrecta = false;
        let userLetter = '';

        if (p.tipo_pregunta === 'respuesta_libre') {
            esCorrecta = userAnsText.trim().length > 0;
        } else {
            const normalize = (s: string) => s?.trim().toLowerCase() ?? '';
            const userText = normalize(userAnsText);

            if (userText === normalize(p.opcion_a)) userLetter = 'A';
            else if (userText === normalize(p.opcion_b)) userLetter = 'B';
            else if (userText === normalize(p.opcion_c)) userLetter = 'C';
            else if (userText === normalize(p.opcion_d)) userLetter = 'D';

            esCorrecta = !!userLetter && userLetter === normalize(p.respuesta_correcta).toUpperCase();
        }

        if (esCorrecta && p.tipo_pregunta !== 'respuesta_libre') {
            correctas++;
        }

        respuestasDetalle[p.id] = {
            respuesta: userLetter,
            respuesta_texto: userAnsText,
            explicacion: explicacion,
            correcta: esCorrecta
        };
    })

    respuestasDetalle['_metadata'] = { bloqueado_seguridad: bloqueadoPorSeguridad } as any;

    const calificacionFinal = Math.round((correctas / divisor) * 100);
    const aprobado = calificacionFinal >= examen.min_aprobacion;

    // 3. Save result
    const { error: insertError } = await supabase
        .from('ie_resultados_examenes')
        .insert({
            user_id: user.id,
            examen_id: examen.id,
            calificacion: calificacionFinal,
            aprobado: aprobado,
            respuestas_detalle: respuestasDetalle
        })

    if (insertError) {
        return { error: 'Error guardando tu calificación: ' + insertError.message }
    }

    // Log de auditoría
    try {
        await supabase.from('ie_auditoria_logs').insert({
            user_id: user.id,
            evento: 'EXAMEN_ENTREGADO',
            detalles: {
                curso_id: cursoId,
                examen_id: examen.id,
                calificacion: calificacionFinal,
                aprobado: aprobado,
                tipo: 'final'
            }
        })
    } catch (err) {
        console.error('Error guardando log de examen final:', err)
    }

    // 4. Notificar al profesor
    try {
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: cursoData } = await supabaseAdmin.from('ie_cursos').select('creado_por, titulo').eq('id', cursoId).single()
        const { data: profileData } = await supabaseAdmin.from('ie_profiles').select('nombre, apellido_paterno, apellido_materno').eq('id', user.id).single()
        
        if (cursoData?.creado_por) {
            const nombreAlumno = [profileData?.nombre, profileData?.apellido_paterno, profileData?.apellido_materno].filter(Boolean).join(' ').trim() || 'Un alumno';
            await supabase.from('ie_notificaciones').insert({
                usuario_id: cursoData.creado_por,
                actor_id: user.id,
                tipo: 'examen_entregado',
                mensaje: `El alumno ${nombreAlumno} ha completado el examen del curso "${cursoData.titulo || 'Módulo'}". Calificación: ${calificacionFinal}%`,
                enlace: '/profesor/revision-examen'
            })
        }
    } catch (notifErr) {
        console.error('Error enviando notificación de examen:', notifErr)
    }

    return {
        success: true,
        calificacion: calificacionFinal,
        aprobado: aprobado,
        minAprobacion: examen.min_aprobacion
    }
}

export async function submitExamenModular(examenId: string, respuestasUsuario: Record<string, string>, explicaciones: Record<string, string>, bloqueadoPorSeguridad: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    // 1. Fetch the exam and correct answers securely on the server
    const { data: examen, error: exmError } = await supabase
        .from('ie_examenes')
        .select('id, min_aprobacion')
        .eq('id', examenId)
        .single()

    if (exmError || !examen) {
        return { error: 'Examen no encontrado en la base de datos' }
    }

    // Fetch full question data including all options to convert user's text answer → letter
    const { data: preguntas, error: pregError } = await supabase
        .from('ie_preguntas')
        .select('id, respuesta_correcta, opcion_a, opcion_b, opcion_c, opcion_d, tipo_pregunta')
        .eq('examen_id', examen.id)

    if (pregError || !preguntas || preguntas.length === 0) {
        return { error: 'No se encontraron las preguntas del examen' }
    }

    // 2. Grade the exam
    let correctas = 0;
    const preguntasMultipleChoice = preguntas.filter(p => p.tipo_pregunta !== 'respuesta_libre');
    const totalMultipleChoice = preguntasMultipleChoice.length;
    const divisor = totalMultipleChoice > 0 ? totalMultipleChoice : (preguntas.length > 0 ? preguntas.length : 1);
    const respuestasDetalle: Record<string, { respuesta: string, respuesta_texto: string, explicacion: string, correcta: boolean }> = {};

    preguntas.forEach(p => {
        const userAnsText = respuestasUsuario[p.id];
        const explicacion = explicaciones[p.id] || '';
        if (!userAnsText) return;

        let esCorrecta = false;
        let userLetter = '';

        if (p.tipo_pregunta === 'respuesta_libre') {
            esCorrecta = userAnsText.trim().length > 0;
        } else {
            const normalize = (s: string) => s?.trim().toLowerCase() ?? '';
            const userText = normalize(userAnsText);

            if (userText === normalize(p.opcion_a)) userLetter = 'A';
            else if (userText === normalize(p.opcion_b)) userLetter = 'B';
            else if (userText === normalize(p.opcion_c)) userLetter = 'C';
            else if (userText === normalize(p.opcion_d)) userLetter = 'D';

            esCorrecta = !!userLetter && userLetter === normalize(p.respuesta_correcta).toUpperCase();
        }

        if (esCorrecta && p.tipo_pregunta !== 'respuesta_libre') {
            correctas++;
        }

        respuestasDetalle[p.id] = {
            respuesta: userLetter,
            respuesta_texto: userAnsText,
            explicacion: explicacion,
            correcta: esCorrecta
        };
    })

    respuestasDetalle['_metadata'] = { bloqueado_seguridad: bloqueadoPorSeguridad } as any;

    const calificacionFinal = Math.round((correctas / divisor) * 100);
    const aprobado = calificacionFinal >= examen.min_aprobacion;

    // 3. Save result
    const { error: insertError } = await supabase
        .from('ie_resultados_examenes')
        .insert({
            user_id: user.id,
            examen_id: examen.id,
            calificacion: calificacionFinal,
            aprobado: aprobado,
            respuestas_detalle: respuestasDetalle
        })

    if (insertError) {
        return { error: 'Error guardando tu calificación: ' + insertError.message }
    }

    // Log de auditoría
    try {
        await supabase.from('ie_auditoria_logs').insert({
            user_id: user.id,
            evento: 'EXAMEN_ENTREGADO',
            detalles: {
                examen_id: examen.id,
                calificacion: calificacionFinal,
                aprobado: aprobado,
                tipo: 'modular'
            }
        })
    } catch (err) {
        console.error('Error guardando log de examen modular:', err)
    }

    // 4. Notificar al profesor
    try {
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        // Necesitamos curso_id para saber quién es el profesor
        const { data: cursoDataExm } = await supabaseAdmin.from('ie_examenes').select('curso_id').eq('id', examenId).single()
        if (cursoDataExm?.curso_id) {
            const { data: cursoData } = await supabaseAdmin.from('ie_cursos').select('creado_por, titulo').eq('id', cursoDataExm.curso_id).single()
            const { data: profileData } = await supabaseAdmin.from('ie_profiles').select('nombre, apellido_paterno, apellido_materno').eq('id', user.id).single()
            
            if (cursoData?.creado_por) {
                const nombreAlumno = [profileData?.nombre, profileData?.apellido_paterno, profileData?.apellido_materno].filter(Boolean).join(' ').trim() || 'Un alumno';
                await supabase.from('ie_notificaciones').insert({
                    usuario_id: cursoData.creado_por,
                    actor_id: user.id,
                    tipo: 'examen_entregado',
                    mensaje: `El alumno ${nombreAlumno} ha completado el examen modular del curso "${cursoData.titulo || 'Módulo'}". Calificación: ${calificacionFinal}%`,
                    enlace: '/profesor/revision-examen'
                })
            }
        }
    } catch (notifErr) {
        console.error('Error enviando notificación de examen modular:', notifErr)
    }

    return {
        success: true,
        calificacion: calificacionFinal,
        aprobado: aprobado,
        minAprobacion: examen.min_aprobacion
    }
}

