import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { cursoId, userId, publicURL, metodo, notas, esConstancia, referredBy } = await req.json()

        const supabaseUser = await createServerClient()

        // 1. Verificar sesión
        const { data: { user } } = await supabaseUser.auth.getUser()
        if (!user || user.id !== userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Cliente Admin para saltar RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 2. Insertar en pagos manuales
        // Oxxo entra como pendiente de verificación pero con acceso automático
        const estadoInicial = metodo === 'oxxo' ? 'pendiente' : 'aprobado';

        const { data: pagoData, error: insertPagoError } = await supabaseAdmin
            .from('ie_pagos_manuales')
            .insert({
                user_id: userId,
                curso_id: cursoId,
                metodo_pago: metodo,
                comprobante_url: publicURL,
                estado: estadoInicial,
                notas: esConstancia ? `Pago automático (Constancia) reportado por ${metodo}` : `Pago automático reportado por ${metodo}`
            })

        if (insertPagoError) throw insertPagoError

        // 3. Dar acceso en ie_compras
        const { data: existe } = await supabaseAdmin
            .from('ie_compras')
            .select('id')
            .eq('user_id', userId)
            .eq('curso_id', cursoId)
            .single()

        if (!existe) {
            const { error: insertError } = await supabaseAdmin
                .from('ie_compras')
                .insert({ 
                    user_id: userId, 
                    curso_id: cursoId, 
                    pagado: true, 
                    pago_completo: esConstancia ? true : false,
                    referred_by: referredBy || null
                })

            if (insertError) throw insertError
        } else {
            if (esConstancia) {
                const { error: updateCompraError } = await supabaseAdmin
                    .from('ie_compras')
                    .update({ pago_completo: true })
                    .eq('id', existe.id)
                
                if (updateCompraError) throw updateCompraError
            }
        }

        return NextResponse.json({ success: true, message: 'Pago reportado y aprobado automáticamente' })
    } catch (error: any) {
        console.error('[API_REPORT_PAYMENT_AUTO_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Hubo un error procesando la solicitud', details: error?.message || String(error) }, { status: 500 })
    }
}
