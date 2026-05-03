import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Genera un código de referido único tipo "CARLOS247"
async function generateReferralCode(supabaseAdmin: any, nombre: string): Promise<string> {
    const base = (nombre || 'USER')
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 8)
    
    let attempts = 0
    while (attempts < 10) {
        const suffix = Math.floor(100 + Math.random() * 900).toString() // 3 dígitos
        const code = `${base}${suffix}`
        const { data } = await supabaseAdmin
            .from('ie_profiles')
            .select('id')
            .eq('referral_code', code)
            .maybeSingle()
        if (!data) return code // código disponible
        attempts++
    }
    // Fallback con timestamp si hubo colisiones
    return `${base}${Date.now().toString().slice(-4)}`
}

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

        // Actualización a aplicar
        const updatePayload: Record<string, any> = { rol: newRole }

        // Si el nuevo rol es profesor o vendedor, generar código de referido si no tiene uno
        if (newRole === 'profesor' || newRole === 'vendedor') {
            const { data: targetProfile } = await supabaseAdmin
                .from('ie_profiles')
                .select('nombre, referral_code')
                .eq('id', userId)
                .single()

            if (!targetProfile?.referral_code) {
                updatePayload.referral_code = await generateReferralCode(supabaseAdmin, targetProfile?.nombre || '')
            }
        }

        const { error } = await supabaseAdmin
            .from('ie_profiles')
            .update(updatePayload)
            .eq('id', userId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, referral_code: updatePayload.referral_code || null })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

