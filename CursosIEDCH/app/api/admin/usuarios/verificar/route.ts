import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const supabaseSession = await createServerClient()
    const { data: { user } } = await supabaseSession.auth.getUser()
    
    if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabaseSession
        .from('ie_profiles')
        .select('rol, permisos_adminjr')
        .eq('id', user.id)
        .single()
        
    const rolActualOperador = profile?.rol
    const permisosOperador = Array.isArray(profile?.permisos_adminjr) ? (profile.permisos_adminjr as string[]) : []

    if (rolActualOperador !== 'admin' && (rolActualOperador !== 'adminjr' || !permisosOperador.includes('usuarios'))) {
        return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { userId, verificado } = body

        if (userId === undefined || verificado === undefined) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // No permitir modificarse a sí mismo
        if (userId === user.id) {
            return NextResponse.json({ error: 'No puedes verificar tu propia cuenta.' }, { status: 403 })
        }

        // Obtener datos del usuario destino
        const { data: targetProfile, error: targetError } = await supabaseAdmin
            .from('ie_profiles')
            .select('rol')
            .eq('id', userId)
            .single()

        if (targetError || !targetProfile) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Si el operador es adminjr, no puede cambiar verificación de un admin principal
        if (rolActualOperador === 'adminjr' && targetProfile.rol === 'admin') {
            return NextResponse.json({ error: 'No tienes autorización para modificar cuentas de administrador.' }, { status: 403 })
        }

        const { error } = await supabaseAdmin
            .from('ie_profiles')
            .update({ verificado })
            .eq('id', userId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
