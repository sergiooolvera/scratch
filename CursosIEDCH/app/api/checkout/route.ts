import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
})

export async function POST(req: Request) {
    try {
        const { cursoId, userId, cuponCodigo } = await req.json()

        // 1. Verificar sesión de Supabase
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.id !== userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // 2. Obtener detalles del curso desde la Base de Datos
        const { data: curso } = await supabase
            .from('ie_cursos')
            .select('*')
            .eq('id', cursoId)
            .single()

        if (!curso) {
            return new NextResponse('Course not found', { status: 404 })
        }

        // 3. Procesar Cupón si existe
        let porcentajeDescuento = 0;
        let finalPrice = curso.precio;
        let usoCupon = false; // Track si se aplicó algún cupón de descuento

        if (cuponCodigo) {
            const { data: cupon } = await supabase
                .from('ie_cupones')
                .select('*')
                .eq('codigo', cuponCodigo)
                .eq('activo', true)
                .single()

            if (cupon) {
                // Verificar si el cupón está asignado a un curso específico
                if (cupon.curso_id && cupon.curso_id !== cursoId) {
                    return NextResponse.json({ error: 'Cupón no válido para este curso' }, { status: 400 })
                }

                porcentajeDescuento = cupon.descuento_porcentaje;
                usoCupon = true; // Se aplicó un cupón → pago NO es completo
                // Calculamos el precio con descuento
                if (porcentajeDescuento === 100) {
                    finalPrice = 0;
                } else {
                    finalPrice = curso.precio - (curso.precio * (porcentajeDescuento / 100));
                }
            } else {
                return NextResponse.json({ error: 'Cupón inválido o expirado' }, { status: 400 })
            }
        }

        // 4. Si el precio final es 0 (Cupón del 100%), lo registramos directo sin Stripe
        if (finalPrice <= 0) {
            // Check si ya lo tiene para no duplicar
            const { data: existe } = await supabase
                .from('ie_compras')
                .select('id')
                .eq('user_id', userId)
                .eq('curso_id', cursoId)
                .single()

            if (!existe) {
                // Cupón 100%: acceso al curso pero pago_completo=false
                await supabase.from('ie_compras').insert({
                    user_id: userId,
                    curso_id: cursoId,
                    pagado: true,
                    pago_completo: false, // Cupón del 100% no cubre la constancia
                    monto_pagado: 0,
                })
            }
            return NextResponse.json({ success: true, url: null })
        } else if (finalPrice < 10) {
            return NextResponse.json({ error: 'El monto mínimo procesable por Stripe (Tarjeta/OXXO) es de $10.00 MXN. Por favor, selecciona otro método de pago o comunícate con soporte.' }, { status: 400 })
        }

        // Determinar el dominio usando el 'Referer' que el navegador siempre envía,
        // o usando directamente el enlace público de Vercel como parche de seguridad absoluto.
        const referer = req.headers.get('referer');
        const absoluteUrl = referer 
            ? new URL(referer).origin 
            : (process.env.NEXT_PUBLIC_APP_URL || 'https://cursos-iedch.vercel.app');

        // 5. Crear sesión de Stripe Checkout si hay un costo > 0
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'oxxo'],
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: `Curso: ${curso.titulo}${porcentajeDescuento > 0 ? ` (Descuento ${porcentajeDescuento}%)` : ''}`,
                            description: curso.descripcion ? curso.descripcion.substring(0, 250) : undefined,
                        },
                        unit_amount: Math.round(finalPrice * 100), // Stripe usa centavos
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${absoluteUrl}/api/checkout/verify?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${absoluteUrl}/cursos/${curso.id}?canceled=1`,
            client_reference_id: userId,
            metadata: {
                curso_id: curso.id,
                user_id: userId,
                pago_completo: usoCupon ? 'false' : 'true', // Stripe metadata es string
                monto_pagado: finalPrice.toString(),
            }
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
