'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function responderPregunta(preguntaId: string, respuesta: string) {
    if (!preguntaId || !respuesta.trim()) {
        throw new Error('Datos incompletos.')
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { error } = await supabaseAdmin
        .from('ie_preguntas_respuestas')
        .update({ 
            respuesta: respuesta.trim(), 
            responded_at: new Date().toISOString() 
        })
        .eq('id', preguntaId)
        
    if (error) {
        console.error('Error al responder pregunta:', error)
        throw new Error('Hubo un problema guardando la respuesta.')
    }

    // Revalidar las rutas para que se actualicen las vistas (Profesor y Alumno)
    revalidatePath('/profesor/preguntas')
}
