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

        // Insertar notificación
        const { error } = await supabaseAdmin.from('ie_notificaciones').insert({
            usuario_id: cursoData.creado_por,
            actor_id: actorId,
            tipo: 'tarea_entregada',
            mensaje: `El alumno ${actorNombre} ha entregado una tarea en el curso "${cursoTitulo}".`,
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
