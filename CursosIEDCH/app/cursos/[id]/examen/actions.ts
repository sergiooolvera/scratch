'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitExamen(cursoId: string, respuestasUsuario: Record<string, string>) {
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
        .single()

    if (exmError || !examen) {
        return { error: 'Examen no encontrado en la base de datos' }
    }

    const { data: preguntas, error: pregError } = await supabase
        .from('ie_preguntas')
        .select('id, respuesta_correcta')
        .eq('examen_id', examen.id)

    if (pregError || !preguntas || preguntas.length === 0) {
        return { error: 'No se encontraron las preguntas del examen' }
    }

    // 2. Grade the exam
    let correctas = 0;
    const total = preguntas.length;

    preguntas.forEach(p => {
        const userAns = respuestasUsuario[p.id];
        // Normalize strings for comparison (in case parsing had tiny discrepancies)
        if (userAns && userAns.trim().toLowerCase() === p.respuesta_correcta.trim().toLowerCase()) {
            correctas++;
        }
    })

    const calificacionFinal = Math.round((correctas / total) * 100);
    const aprobado = calificacionFinal >= examen.min_aprobacion;

    // 3. Save result
    const { error: insertError } = await supabase
        .from('ie_resultados_examenes')
        .insert({
            user_id: user.id,
            examen_id: examen.id,
            calificacion: calificacionFinal,
            aprobado: aprobado
        })

    if (insertError) {
        return { error: 'Error guardando tu calificación: ' + insertError.message }
    }

    revalidatePath(`/cursos/${cursoId}/examen`)

    return {
        success: true,
        calificacion: calificacionFinal,
        aprobado: aprobado,
        minAprobacion: examen.min_aprobacion
    }
}
