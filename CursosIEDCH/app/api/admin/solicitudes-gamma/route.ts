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

        // Obtener usuarios con solicitudes de Gamma
        const { data: solicitudes, error } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre, apellido_paterno, apellido_materno, rol, limite_generaciones_gamma')
            .eq('solicitud_mas_intentos_gamma', true)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data: solicitudes })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// Aprobar solicitud (dar más intentos)
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

        // Obtener límite actual
        const { data: targetProfile, error: fetchError } = await supabaseAdmin
            .from('ie_profiles')
            .select('limite_generaciones_gamma')
            .eq('id', userId)
            .single()

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        const currentLimit = targetProfile?.limite_generaciones_gamma ?? 3
        const newLimit = currentLimit + 3

        const { error } = await supabaseAdmin
            .from('ie_profiles')
            .update({ 
                solicitud_mas_intentos_gamma: false,
                limite_generaciones_gamma: newLimit
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
