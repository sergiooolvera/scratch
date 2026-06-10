import { createClient } from '@/lib/supabase/server'

interface NotificationProps {
    usuario_id: string
    actor_id?: string
    tipo: string
    mensaje: string
    enlace?: string
}

export async function createServerNotification(props: NotificationProps) {
    const supabase = await createClient()
    
    try {
        const { error } = await supabase
            .from('ie_notificaciones')
            .insert({
                usuario_id: props.usuario_id,
                actor_id: props.actor_id || null,
                tipo: props.tipo,
                mensaje: props.mensaje,
                enlace: props.enlace || null,
                leida: false
            })

        if (error) {
            console.error('Error creating notification:', error)
            return false
        }
        return true
    } catch (e) {
        console.error('Exception creating notification:', e)
        return false
    }
}
