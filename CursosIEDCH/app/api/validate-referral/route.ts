import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()

    if (!code) return NextResponse.json({ valid: false, error: 'Código vacío' }, { status: 400 })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
        .from('ie_profiles')
        .select('id, nombre, apellido_paterno, rol, referral_code')
        .eq('referral_code', code)
        .in('rol', ['profesor', 'vendedor'])
        .eq('activo', true)
        .single()

    if (error || !data) {
        return NextResponse.json({ valid: false, error: 'Código de referido no encontrado' })
    }

    const nombre = `${data.nombre || ''} ${data.apellido_paterno || ''}`.trim() || 'Colaborador'
    return NextResponse.json({ valid: true, id: data.id, nombre, rol: data.rol })
}
