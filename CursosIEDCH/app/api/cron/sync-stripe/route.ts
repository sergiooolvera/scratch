import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // 1. Verificación de Seguridad del Demonio (Cron Secret) o Usuario Admin
        let isCronAllowed = false;
        const authHeader = req.headers.get('authorization');

        if (!process.env.CRON_SECRET || (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`)) {
            isCronAllowed = true;
        } else {
            try {
                // Verificar si es Admin autenticado
                const { createClient: createServerClient } = await import('@/lib/supabase/server');
                const supabaseServer = await createServerClient();
                const { data: { user } } = await supabaseServer.auth.getUser();
                if (user) {
                    const { data: profile } = await supabaseServer.from('ie_profiles').select('rol').eq('id', user.id).single();
                    if (profile?.rol === 'admin') isCronAllowed = true;
                }
            } catch (e) {
                console.error("No valid session for admin check");
            }
        }

        if (!isCronAllowed) {
            return new NextResponse('Unauthorized access to Vercel Cron', { status: 401 });
        }

        // 2. Cliente de Supabase con permisos de Admin (Service Role)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 3. Obtener las últimas 100 sesiones de Stripe
        // (100 cubre varios días de ventas en etapas tempranas; suficiente para intervalos de 2 horas)
        const sessions = await stripe.checkout.sessions.list({ 
            limit: 100 
        });

        // Filtrar solo aquellas que ya fueron pagadas y que contienen la metadata esperada
        const paidSessions = sessions.data.filter(s => 
            s.payment_status === 'paid' && 
            s.metadata?.user_id && 
            s.metadata?.curso_id
        );

        if (paidSessions.length === 0) {
            return NextResponse.json({ message: 'No recent paid sessions found.' });
        }

        let syncedCount = 0;
        let checkedCount = paidSessions.length;

        // 4. Verificación y Sincronización
        for (const session of paidSessions) {
            const userId = session.metadata!.user_id;
            const cursoId = session.metadata!.curso_id;
            
            // Determinar si es pago completo y el monto pagado
            const pagoCompleto = session.metadata?.pago_completo === 'false' ? false : true;
            const montoPagado = session.metadata?.monto_pagado ? Number(session.metadata.monto_pagado) : session.amount_total ? session.amount_total / 100 : 0;

            // Revisar si ya existe la compra en la base de datos
            const { data: existe } = await supabaseAdmin
                .from("ie_compras")
                .select("id")
                .eq("user_id", userId)
                .eq("curso_id", cursoId)
                .single();

            // Si NO existe en la base de datos pero el pago SÍ fue exitoso en Stripe
            if (!existe) {
                console.log(`[CRON] Identificada compra faltante. Sincronizando... User: ${userId}, Curso: ${cursoId}`);
                
                const { error } = await supabaseAdmin.from("ie_compras").insert({
                    user_id: userId,
                    curso_id: cursoId,
                    pagado: true,
                    pago_completo: pagoCompleto,
                    monto_pagado: montoPagado
                });

                if (error) {
                    console.error('[CRON] Error al insertar compra faltante:', error);
                } else {
                    syncedCount++;
                }
            }
        }

        return NextResponse.json({ 
            message: 'Stripe sync completed successfully.', 
            checkedSessions: checkedCount,
            missingPurchasesRecovered: syncedCount
        });

    } catch (err: any) {
        console.error('[CRON_ERROR] sync-stripe:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
