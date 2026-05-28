'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function calificarTarea(submissionId: string, calificacion: number, retroalimentacion: string) {
    if (!submissionId || calificacion === undefined || calificacion === null) {
        throw new Error('Datos incompletos.')
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Fetch current submission
    const { data: submission, error: fetchErr } = await supabaseAdmin
        .from('ie_preguntas_respuestas')
        .select('*')
        .eq('id', submissionId)
        .single()

    if (fetchErr || !submission) {
        throw new Error('No se encontró la entrega de la tarea.')
    }

    // 2. Parse payload
    const parts = submission.pregunta.split('::')
    const header = parts[0] // TAREA_ENTREGA:moduloId
    let payload: any = {}
    try {
        payload = JSON.parse(parts.slice(1).join('::'))
    } catch (e) {
        console.error('Error parsing payload during grading:', e)
    }

    // Update payload
    payload.calificacion = calificacion
    payload.retroalimentacion = retroalimentacion

    const updatedPregunta = `${header}::${JSON.stringify(payload)}`

    // 3. Update row in DB
    const { error: updateErr } = await supabaseAdmin
        .from('ie_preguntas_respuestas')
        .update({
            pregunta: updatedPregunta,
            respuesta: 'TAREA_ENTREGA_CALIFICADA',
            responded_at: new Date().toISOString()
        })
        .eq('id', submissionId)

    if (updateErr) {
        console.error('Error al calificar tarea:', updateErr)
        throw new Error('No se pudo guardar la calificación.')
    }

    revalidatePath('/profesor/revision-tareas')
}
