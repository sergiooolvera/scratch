'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitExamen(cursoId: string, respuestasUsuario: Record<string, string>, explicaciones: Record<string, string>) {
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

    // Fetch full question data including all options to convert user's text answer → letter
    const { data: preguntas, error: pregError } = await supabase
        .from('ie_preguntas')
        .select('id, respuesta_correcta, opcion_a, opcion_b, opcion_c, opcion_d')
        .eq('examen_id', examen.id)

    if (pregError || !preguntas || preguntas.length === 0) {
        return { error: 'No se encontraron las preguntas del examen' }
    }

    // 2. Grade the exam
    let correctas = 0;
    const total = preguntas.length;
    const respuestasDetalle: Record<string, { respuesta: string, respuesta_texto: string, explicacion: string, correcta: boolean }> = {};

    preguntas.forEach(p => {
        const userAnsText = respuestasUsuario[p.id];
        const explicacion = explicaciones[p.id] || '';
        if (!userAnsText) return;

        const normalize = (s: string) => s?.trim().toLowerCase() ?? '';
        const userText = normalize(userAnsText);

        let userLetter = '';
        if (userText === normalize(p.opcion_a)) userLetter = 'A';
        else if (userText === normalize(p.opcion_b)) userLetter = 'B';
        else if (userText === normalize(p.opcion_c)) userLetter = 'C';
        else if (userText === normalize(p.opcion_d)) userLetter = 'D';

        const esCorrecta = !!userLetter && userLetter === normalize(p.respuesta_correcta).toUpperCase();
        if (esCorrecta) {
            correctas++;
        }

        respuestasDetalle[p.id] = {
            respuesta: userLetter,
            respuesta_texto: userAnsText,
            explicacion: explicacion,
            correcta: esCorrecta
        };
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
            aprobado: aprobado,
            respuestas_detalle: respuestasDetalle
        })

    if (insertError) {
        return { error: 'Error guardando tu calificación: ' + insertError.message }
    }

    return {
        success: true,
        calificacion: calificacionFinal,
        aprobado: aprobado,
        minAprobacion: examen.min_aprobacion
    }
}
