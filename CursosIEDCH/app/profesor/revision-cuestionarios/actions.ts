'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function calificarCuestionario(respuestaId: string, evaluaciones: Record<string, { etiqueta: string, retroalimentacion: string }>) {
    const supabase = await createClient()

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const [uid, modId] = respuestaId.split('_')

    const now = new Date().toISOString()
    let hasError = false
    let lastErrorMessage = ''

    // Actualizar cada respuesta de forma independiente
    for (const [preguntaId, evaluacion] of Object.entries(evaluaciones)) {
        const { error } = await supabaseAdmin
            .from('ie_cuestionario_respuestas')
            .update({
                calificacion: evaluacion.etiqueta,
                feedback: evaluacion.retroalimentacion,
                responded_at: now
            })
            .eq('user_id', uid)
            .eq('pregunta_id', preguntaId)

        if (error) {
            hasError = true
            lastErrorMessage = error.message
        }
    }

    if (hasError) {
        throw new Error(lastErrorMessage || 'Error al actualizar algunas evaluaciones.')
    }

    const { notifyAlumnoCuestionarioEvaluado } = await import('@/app/actions/taskNotifications')
    
    // Obtener info del perfil del profe y del curso para la notificación
    const { data: profile } = await supabase.from('ie_profiles').select('nombre').eq('id', user.id).single()
    
    // Obtener alumno y curso desde ie_cuestionario_respuestas -> modulo -> curso
    const { data: modData } = await supabase.from('ie_curso_modulos').select('curso_id').eq('id', modId).single()
    if (modData) {
        const { data: cursoData } = await supabase.from('ie_cursos').select('titulo').eq('id', modData.curso_id).single()
        if (cursoData) {
            await notifyAlumnoCuestionarioEvaluado(
                uid,
                user.id,
                profile?.nombre || 'Instructor',
                modData.curso_id,
                cursoData.titulo
            )
        }
    }

    revalidatePath('/profesor/revision-cuestionarios')
    return { success: true }
}
