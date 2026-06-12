'use server'

import { createClient } from '@supabase/supabase-js'

export async function notifyProfesorTaskSubmission(cursoId: string, actorId: string, actorNombre: string, cursoTitulo: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Obtener al profesor del curso
        const { data: cursoData } = await supabaseAdmin
            .from('ie_cursos')
            .select('creado_por')
            .eq('id', cursoId)
            .single()

        if (!cursoData || !cursoData.creado_por) return { success: false, error: 'Curso o profesor no encontrado' }

        const { data: profileData } = await supabaseAdmin.from('ie_profiles').select('nombre, apellido_paterno, apellido_materno').eq('id', actorId).single()
        const realNombre = [profileData?.nombre, profileData?.apellido_paterno, profileData?.apellido_materno].filter(Boolean).join(' ').trim() || actorNombre || 'Un alumno';

        // Insertar notificación
        const { error } = await supabaseAdmin.from('ie_notificaciones').insert({
            usuario_id: cursoData.creado_por,
            actor_id: actorId,
            tipo: 'tarea_entregada',
            mensaje: `El alumno ${realNombre} ha entregado una tarea en el curso "${cursoTitulo}".`,
            enlace: `/profesor/revision-tareas`
        })

        if (error) {
            console.error('Error insertando notificacion de tarea:', error)
            return { success: false, error }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in notifyProfesorTaskSubmission:', error)
        return { success: false, error }
    }
}

export async function notifyProfesorCuestionarioSubmission(cursoId: string, actorId: string, actorNombre: string, cursoTitulo: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: cursoData } = await supabaseAdmin
            .from('ie_cursos')
            .select('creado_por')
            .eq('id', cursoId)
            .single()

        if (!cursoData || !cursoData.creado_por) return { success: false, error: 'Curso o profesor no encontrado' }

        const { data: profileData } = await supabaseAdmin.from('ie_profiles').select('nombre, apellido_paterno, apellido_materno').eq('id', actorId).single()
        const realNombre = [profileData?.nombre, profileData?.apellido_paterno, profileData?.apellido_materno].filter(Boolean).join(' ').trim() || actorNombre || 'Un alumno';

        const { error } = await supabaseAdmin.from('ie_notificaciones').insert({
            usuario_id: cursoData.creado_por,
            actor_id: actorId,
            tipo: 'cuestionario_entregado',
            mensaje: `El alumno ${realNombre} ha enviado sus respuestas de cuestionario abierto en el curso "${cursoTitulo}".`,
            enlace: `/profesor/revision-cuestionarios`
        })

        if (error) {
            console.error('Error insertando notificacion de cuestionario:', error)
            return { success: false, error }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in notifyProfesorCuestionarioSubmission:', error)
        return { success: false, error }
    }
}

export async function notifyAlumnoCuestionarioEvaluado(alumnoId: string, actorId: string, actorNombre: string, cursoId: string, cursoTitulo: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabaseAdmin.from('ie_notificaciones').insert({
            usuario_id: alumnoId,
            actor_id: actorId,
            tipo: 'cuestionario_evaluado',
            mensaje: `El instructor ${actorNombre} ha evaluado tu cuestionario en el curso "${cursoTitulo}".`,
            enlace: `/cursos/${cursoId}/contenido`
        })

        if (error) {
            console.error('Error insertando notificacion al alumno:', error)
            return { success: false, error }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in notifyAlumnoCuestionarioEvaluado:', error)
        return { success: false, error }
    }
}
