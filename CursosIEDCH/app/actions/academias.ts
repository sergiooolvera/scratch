'use server'

import { createClient } from '@supabase/supabase-js'

export async function eliminarAcademiaAction(academiaId: string, userId: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Validar que la academia exista y que pertenezca al usuario que solicita el borrado
        const { data: academia, error: fetchErr } = await supabaseAdmin
            .from('ie_academias')
            .select('creado_por')
            .eq('id', academiaId)
            .single()

        if (fetchErr) throw fetchErr

        if (!academia || academia.creado_por !== userId) {
            return { success: false, error: 'No tienes permisos para eliminar esta academia.' }
        }

        // 2. Ejecutar la eliminación con service_role
        const { error: deleteErr } = await supabaseAdmin
            .from('ie_academias')
            .delete()
            .eq('id', academiaId)

        if (deleteErr) throw deleteErr

        return { success: true }
    } catch (error: any) {
        console.error('Error in eliminarAcademiaAction:', error)
        return { success: false, error: error.message || error }
    }
}
