'use server'

import { createClient } from '@supabase/supabase-js'

export async function notifyAdminsOnCourseEdit(cursoTitulo: string, actorId: string, actorNombre: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Obtener administradores y financieros
        const { data: rolesAuth } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, rol')
            .in('rol', ['admin', 'financiero'])

        if (!rolesAuth || rolesAuth.length === 0) return { success: true }

        const notificacionesInsert = rolesAuth.map(u => ({
            usuario_id: u.id,
            actor_id: actorId,
            tipo: 'edicion_curso',
            mensaje: `El profesor ${actorNombre} ha modificado el curso "${cursoTitulo}" y espera revisión.`,
            enlace: `/admin/cursos`
        }))

        if (notificacionesInsert.length > 0) {
            await supabaseAdmin.from('ie_notificaciones').insert(notificacionesInsert)
        }

        return { success: true }
    } catch (error) {
        console.error('Error in notifyAdminsOnCourseEdit:', error)
        return { success: false, error }
    }
}
