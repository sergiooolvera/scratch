import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Leer solicitudes pendientes
export async function GET() {
    try {
        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Validar rol admin
        const { data: profile } = await supabaseAdmin
            .from('ie_profiles')
            .select('rol')
            .eq('id', user.id)
            .single()

        if (profile?.rol !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Obtener usuarios con solicitudes
        const { data: solicitudes, error } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre, apellido_paterno, apellido_materno, rol, email, created_at')
            .eq('solicitud_cambio_datos', true)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data: solicitudes })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// Aprobar solicitud (habilitar edición)
export async function POST(request: Request) {
    try {
        const { userId } = await request.json()
        if (!userId) {
            return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
        }

        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Validar rol admin
        const { data: profile } = await supabaseAdmin
            .from('ie_profiles')
            .select('rol')
            .eq('id', user.id)
            .single()

        if (profile?.rol !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const { error } = await supabaseAdmin
            .from('ie_profiles')
            .update({ 
                solicitud_cambio_datos: false,
                datos_bancarios_capturados: false
            })
            .eq('id', userId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
