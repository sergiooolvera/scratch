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
        .select('rol')
        .eq('id', user.id)
        .single()
        
    if (profile?.rol !== 'admin') {
        return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { userId, newRole } = body

        if (!userId || !newRole) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error } = await supabaseAdmin
            .from('ie_profiles')
            .update({ rol: newRole })
            .eq('id', userId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
