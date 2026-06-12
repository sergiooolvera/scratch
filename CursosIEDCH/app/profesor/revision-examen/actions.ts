'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function getResultadosExamen(cursoId: string) {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    // 2. Verify that the user is the creator of the course
    const { data: curso, error: cursoError } = await supabase
        .from('ie_cursos')
        .select('creado_por')
        .eq('id', cursoId)
        .single()

    if (cursoError || !curso) {
        return { error: 'Curso no encontrado' }
    }

    if (curso.creado_por !== user.id) {
        return { error: 'No eres el profesor de este curso' }
    }

    // 3. Fetch results using admin client to bypass RLS
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: examenes, error: examenesError } = await supabaseAdmin
        .from('ie_examenes')
        .select('id, modulo_id, min_aprobacion')
        .eq('curso_id', cursoId)

    if (examenesError) {
        return { error: 'Error al buscar exámenes: ' + examenesError.message }
    }

    if (!examenes || examenes.length === 0) {
        return { success: true, data: [], preguntas: [] }
    }

    const examenIds = examenes.map(e => e.id)
    const moduloIds = examenes.map(e => e.modulo_id).filter(Boolean)

    const { data: modulos } = moduloIds.length > 0
        ? await supabaseAdmin
            .from('ie_curso_modulos')
            .select('id, titulo, orden')
            .in('id', moduloIds)
        : { data: [] }

    const examenMeta = new Map(examenes.map(examen => {
        const modulo = modulos?.find(m => m.id === examen.modulo_id)
        return [examen.id, {
            id: examen.id,
            modulo_id: examen.modulo_id,
            titulo: modulo ? `Módulo ${modulo.orden || ''}: ${modulo.titulo}`.trim() : 'Examen final',
            tipo: modulo ? 'modular' : 'final',
            orden: modulo?.orden || 0
        }]
    }))

    const examenesOrdenados = Array.from(examenMeta.values()).sort((a: any, b: any) => {
        if (a.tipo !== b.tipo) return a.tipo === 'final' ? -1 : 1
        return (a.orden || 0) - (b.orden || 0)
    })

    const { data: res, error: resError } = await supabaseAdmin
        .from('ie_resultados_examenes')
        .select('*')
        .in('examen_id', examenIds)
        .order('created_at', { ascending: false })

    if (resError) {
        return { error: 'Error al buscar resultados: ' + resError.message }
    }

    const { data: preguntas } = await supabaseAdmin
        .from('ie_preguntas')
        .select('*')
        .in('examen_id', examenIds)
        .order('orden', { ascending: true })

    if (res && res.length > 0) {
        const userIds = res.map(r => r.user_id);
        const { data: profiles } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre, apellido_paterno, apellido_materno')
            .in('id', userIds);

        const resWithProfiles = res.map(r => {
            const profile = profiles?.find(p => p.id === r.user_id);
            return {
                ...r,
                examen: examenMeta.get(r.examen_id),
                ie_profiles: profile
            };
        });

        return { success: true, data: resWithProfiles, preguntas: preguntas || [], examenes: examenesOrdenados };
    }

    return { success: true, data: [], preguntas: preguntas || [], examenes: examenesOrdenados };
}

export async function guardarRevisionExamenProfesor(
    resultadoId: string, 
    retroalimentacionGeneral: string, 
    calificacionesPreguntas: Record<string, string>
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    // Bypass RLS using admin client to update the result
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch current result
    const { data: resRow, error: fetchError } = await supabaseAdmin
        .from('ie_resultados_examenes')
        .select('respuestas_detalle')
        .eq('id', resultadoId)
        .single()

    if (fetchError || !resRow) {
        return { error: 'No se encontró el resultado del examen' }
    }

    const respuestasDetalle = (resRow.respuestas_detalle as Record<string, any>) || {}

    // 2. Set retroalimentacion general
    respuestasDetalle.retroalimentacion_profesor = retroalimentacionGeneral;

    // 3. Set calificacion of free questions
    Object.entries(calificacionesPreguntas).forEach(([pregId, calif]) => {
        if (respuestasDetalle[pregId]) {
            respuestasDetalle[pregId].calificacion_abierta = calif;
        } else {
            respuestasDetalle[pregId] = {
                respuesta: '',
                respuesta_texto: '',
                explicacion: '',
                correcta: true,
                calificacion_abierta: calif
            }
        }
    })

    // 4. Update the DB row
    const { error: updateError } = await supabaseAdmin
        .from('ie_resultados_examenes')
        .update({ respuestas_detalle: respuestasDetalle })
        .eq('id', resultadoId)

    if (updateError) {
        return { error: 'Error al guardar la revisión: ' + updateError.message }
    }

    // 5. Notificar al alumno
    try {
        const { data: userData } = await supabaseAdmin.from('ie_resultados_examenes').select('user_id, examen_id').eq('id', resultadoId).single()
        if (userData?.user_id && userData?.examen_id) {
            // Buscamos el nombre del curso
            const { data: examenData } = await supabaseAdmin.from('ie_examenes').select('curso_id').eq('id', userData.examen_id).single()
            if (examenData?.curso_id) {
                const { data: cursoData } = await supabaseAdmin.from('ie_cursos').select('titulo').eq('id', examenData.curso_id).single()
                
                await supabaseAdmin.from('ie_notificaciones').insert({
                    usuario_id: userData.user_id,
                    actor_id: user.id,
                    tipo: 'examen_calificado',
                    mensaje: `El profesor ha revisado tu examen y añadido comentarios en el curso "${cursoData?.titulo || 'Módulo'}".`,
                    enlace: `/cursos/${examenData.curso_id}`
                })
            }
        }
    } catch (notifErr) {
        console.error('Error notificando alumno de examen revisado:', notifErr)
    }

    return { success: true }
}

export async function eliminarResultadoExamen(resultadoId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: deleteError } = await supabaseAdmin
        .from('ie_resultados_examenes')
        .delete()
        .eq('id', resultadoId)

    if (deleteError) {
        return { error: 'Error al eliminar el resultado: ' + deleteError.message }
    }

    return { success: true }
}

