import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Usamos service role para saltar RLS y leer todos los campos del perfil propio
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: profile, error } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre, apellido_paterno, apellido_materno, rol, referral_code, activo, telefono, banco, clabe')
            .eq('id', user.id)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data: profile })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
