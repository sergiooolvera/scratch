import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('ie_profiles')
        .select('rol, permisos_adminjr')
        .eq('id', user.id)
        .single()

    const rol = profile?.rol || 'alumno'

    // Si no es admin ni adminjr, denegar acceso
    if (rol !== 'admin' && rol !== 'adminjr') {
        redirect('/dashboard')
    }

    return (
        <div>
            {children}
        </div>
    )
}

