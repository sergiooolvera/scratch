import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseSession = await createServerClient();
        const { data: { user } } = await supabaseSession.auth.getUser();

        if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { data: profile } = await supabaseSession
            .from('ie_profiles')
            .select('rol')
            .eq('id', user.id)
            .single();

        if (profile?.rol !== 'admin' && profile?.rol !== 'financiero' && profile?.rol !== 'profesor') return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let profCursoIds: Set<string> | null = null;
        if (profile?.rol === 'profesor') {
            const { data: profCursos } = await supabaseAdmin.from('ie_cursos').select('id').eq('creado_por', user.id);
            profCursoIds = new Set(profCursos?.map(c => c.id) || []);
        }

        // Fetch cursos
        const { data: cursos } = await supabaseAdmin.from('ie_cursos').select('id, titulo, precio, creado_por');
        const cursoMap: Record<string, { titulo: string, precio: number, profesor_id: string }> = {};
        cursos?.forEach(c => { cursoMap[c.id] = { titulo: c.titulo, precio: c.precio, profesor_id: c.creado_por } });

        const matchedKeys = new Set<string>();

        // Fetch perfiles (para no tener N/A en nombres)
        const { data: perfiles } = await supabaseAdmin.from('ie_profiles').select('id, nombre, apellido_paterno, apellido_materno');
        const profileNameMap: Record<string, string> = {};
        perfiles?.forEach(p => { 
            profileNameMap[p.id] = `${p.nombre || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim() || 'Desconocido'
        });

        // Fetch referidos desde ie_compras para cruzar con transacciones
        const { data: comprasReferidas } = await supabaseAdmin
            .from('ie_compras')
            .select('user_id, curso_id, referred_by, fecha_compra')
            .not('referred_by', 'is', null);
        // Almacenar referido CON fecha de compra para poder hacer match preciso
        const referralMap: Record<string, { referred_by: string; fecha: string }> = {};
        comprasReferidas?.forEach(c => {
            if (c.referred_by) referralMap[`${c.user_id}_${c.curso_id}`] = { referred_by: c.referred_by, fecha: c.fecha_compra };
        });

        // Fetch Stripe - paginación completa para traer TODAS las sesiones
        const allSessionsData: Stripe.Checkout.Session[] = [];
        let hasMore = true;
        let startingAfter: string | undefined = undefined;

        while (hasMore) {
            const params: Stripe.Checkout.SessionListParams = {
                limit: 100,
                expand: ['data.payment_intent.latest_charge', 'data.total_details'],
            };
            if (startingAfter) params.starting_after = startingAfter;

            const response = await stripe.checkout.sessions.list(params);
            allSessionsData.push(...response.data);
            hasMore = response.has_more;
            if (response.data.length > 0) {
                startingAfter = response.data[response.data.length - 1].id;
            }
        }

        const sessions = { data: allSessionsData };

        const stripeTransactions = sessions.data.map(session => {
            const isPaid = session.payment_status === 'paid';
            if (!isPaid) return null; // Solo reportamos lo pagado

            const pi = session.payment_intent as any;
            let methodLabel = 'Tarjeta';
            
            if (pi?.next_action?.type === 'display_oxxo_details') {
                methodLabel = 'OXXO (Ficha generada)';
            } else if (pi?.payment_method_types?.includes('oxxo') && pi?.status === 'succeeded') {
                methodLabel = 'OXXO';
            } else if (session.payment_method_types?.length === 1 && session.payment_method_types[0] === 'oxxo') {
                methodLabel = 'OXXO';
            }

            const amountDiscount = session.total_details?.amount_discount || 0;
            const hasBono = amountDiscount > 0;
            const bonoLabel = hasBono ? ` (Cupón -$${(amountDiscount/100).toFixed(2)})` : '';
            
            const uid = session.metadata?.user_id;
            const cid = session.metadata?.curso_id;
            if (uid && cid) matchedKeys.add(`${uid}_${cid}`);

            // Fecha de pago (si ya se pagó con OXXO/Tarjeta)
            let paid_at = null;
            if (isPaid && pi?.latest_charge?.created) {
                paid_at = pi.latest_charge.created;
            } else if (isPaid && pi?.created) {
                paid_at = pi.created;
            }

            let customerName = session.customer_details?.name;
            if (!customerName || customerName === 'N/A' || customerName.trim() === '') {
                customerName = profileNameMap[uid || ''] || 'N/A';
            }

            const cData = cursoMap[cid || ''];

            return {
                id: session.id,
                origin: 'Stripe',
                created: session.created,
                paid_at: paid_at,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency?.toUpperCase() || 'MXN',
                status: session.status, 
                payment_status: session.payment_status,
                customer_email: session.customer_details?.email || session.metadata?.email || 'N/A',
                customer_name: customerName,
                curso_id: cid,
                curso_titulo: cData?.titulo || 'Curso desconocido',
                profesor_id: cData?.profesor_id || null,
                profesor_nombre: profileNameMap[cData?.profesor_id] || 'Desconocido',
                method: methodLabel + bonoLabel,
                // referred_by viene del metadata de STRIPE (solo si el alumno usó código en ESE checkout)
                referred_by: session.metadata?.referred_by || null,
            };
        }).filter((t): t is NonNullable<typeof t> => t !== null);

        // Manuales
        const { data: manuales } = await supabaseAdmin
            .from('ie_pagos_manuales')
            .select(`*`)
            .order('fecha_solicitud', { ascending: false });

        const manualTransactions = await Promise.all((manuales || []).map(async m => {
            const curso = cursoMap[m.curso_id];
            let email = 'N/A';
            let name = 'Desconocido';
            try {
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
                if (authUser?.user?.email) email = authUser.user.email;
                const { data: prof } = await supabaseAdmin.from('ie_profiles').select('nombre').eq('id', m.user_id).single();
                if (prof?.nombre) name = prof.nombre;
            } catch {}

            matchedKeys.add(`${m.user_id}_${m.curso_id}`);
            
                // Solo asignar referido si la fecha del pago manual coincide con la fecha de la compra referida (±48h)
                let manualReferredBy: string | null = null;
                const refEntry = referralMap[`${m.user_id}_${m.curso_id}`];
                if (refEntry) {
                    const compraDate = new Date(refEntry.fecha).getTime();
                    const manualDate = new Date(m.fecha_solicitud).getTime();
                    const diffHours = Math.abs(compraDate - manualDate) / (1000 * 60 * 60);
                    if (diffHours < 48) manualReferredBy = refEntry.referred_by;
                }

                return {
                id: m.id,
                origin: 'Manual',
                created: Math.floor(new Date(m.fecha_solicitud).getTime() / 1000),
                paid_at: m.estado === 'aprobado' ? Math.floor(new Date(m.fecha_revision || m.fecha_solicitud).getTime() / 1000) : null,
                amount: curso?.precio || 0,
                currency: 'MXN',
                status: m.estado === 'aprobado' ? 'complete' : m.estado === 'rechazado' ? 'expired' : 'open',
                payment_status: m.estado === 'aprobado' ? 'paid' : 'unpaid',
                customer_email: email,
                customer_name: name,
                curso_id: m.curso_id,
                curso_titulo: curso?.titulo || 'Curso desconocido',
                profesor_id: curso?.profesor_id || null,
                profesor_nombre: profileNameMap[curso?.profesor_id] || 'Desconocido',
                method: 'Transferencia/Depósito / Efectivo',
                referred_by: manualReferredBy,
            };
        }));

        // Compras (Cupones 100% o accesos directos base de datos)
        const { data: comprasDB } = await supabaseAdmin
            .from('ie_compras')
            .select('*')
            .eq('pagado', true);

        const comprasUnmatched = await Promise.all((comprasDB || []).filter(c => !matchedKeys.has(`${c.user_id}_${c.curso_id}`)).map(async c => {
            const curso = cursoMap[c.curso_id];
            let email = 'N/A';
            let name = 'Desconocido';
            try {
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(c.user_id);
                if (authUser?.user?.email) email = authUser.user.email;
                const { data: prof } = await supabaseAdmin.from('ie_profiles').select('nombre, apellido_paterno, apellido_materno').eq('id', c.user_id).single();
                if (prof) name = `${prof.nombre || ''} ${prof.apellido_paterno || ''} ${prof.apellido_materno || ''}`.trim() || 'Desconocido';
            } catch {}

            const montoPago = c.monto_pagado ?? 0;
            let finalOrigin = 'Sistema / Directo';
            let finalMethod = 'Acceso Directo DB';
            
            if (montoPago > 0) {
                finalOrigin = 'Stripe (Historial)';
                finalMethod = c.pago_completo ? 'Tarjeta / OXXO (Histórico)' : 'Tarjeta / OXXO (Con Cupón)';
            } else if (c.pago_completo === false) {
                finalOrigin = 'Cupón / Beca';
                finalMethod = 'Cupón 100% Descuento';
            }

            return {
                id: c.id,
                origin: finalOrigin,
                created: Math.floor(new Date(c.fecha_compra).getTime() / 1000),
                paid_at: Math.floor(new Date(c.fecha_compra).getTime() / 1000),
                amount: montoPago,
                currency: 'MXN',
                status: 'complete',
                payment_status: 'paid',
                customer_email: email,
                customer_name: name,
                curso_id: c.curso_id,
                curso_titulo: curso?.titulo || 'Curso desconocido',
                profesor_nombre: profileNameMap[curso?.profesor_id] || 'Desconocido',
                method: finalMethod,
            };
        }));

        let allTransactions = [...stripeTransactions, ...manualTransactions, ...comprasUnmatched]
            .sort((a, b) => b.created - a.created);

        if (profCursoIds) {
            allTransactions = allTransactions.filter(t => profCursoIds!.has(t.curso_id));
        }

        return NextResponse.json({ data: allTransactions });

    } catch (err: any) {
        console.error('Error consolidated transactions:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
