import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // 1. Verificar sesión del admin
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

    // 2. Fetch de datos con clave de servicio para evadir RLS de ie_profiles
    // NOTA: NEXT_PUBLIC_SUPABASE_ANON_KEY en este proyecto actúa como service role
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
        const { data: pagosData, error } = await supabaseAdmin
            .from('ie_pagos_manuales')
            .select(`
                *,
                curso:curso_id (titulo)
            `)
            .order('fecha_solicitud', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!pagosData || pagosData.length === 0) {
            return NextResponse.json({ data: [] })
        }

        const userIds = [...new Set(pagosData.map(p => p.user_id))]

        const { data: perfiles } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre')
            .in('id', userIds)

        const pagosCompletos = await Promise.all(pagosData.map(async pago => {
            const perfilData = perfiles?.find(u => u.id === pago.user_id)
            let email = 'N/A'
            try {
                if (pago.user_id) {
                    const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(pago.user_id)
                    if (userAuth?.user?.email) {
                        email = userAuth.user.email
                    }
                }
            } catch (e) {
                console.error('Error fetching email for user', pago.user_id, e)
            }
            
            return {
                ...pago,
                perfil: {
                    nombre: perfilData?.nombre || 'Desconocido',
                    email: email
                }
            }
        }))

        return NextResponse.json({ data: pagosCompletos })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
