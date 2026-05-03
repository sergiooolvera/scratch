import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
})

export async function POST(req: Request) {
    try {
        const { cursoId, userId, cuponCodigo, esConstancia, referralCode } = await req.json()

        // 1. Verificar sesión de Supabase
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.id !== userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // 2. Obtener detalles del curso
        const { data: curso } = await supabase
            .from('ie_cursos')
            .select('*')
            .eq('id', cursoId)
            .single()

        if (!curso) {
            return new NextResponse('Course not found', { status: 404 })
        }

        // 3. Resolver código de referido (opcional, se ignora si inválido)
        let referredById: string | null = null
        if (referralCode) {
            const { data: referrer } = await supabase
                .from('ie_profiles')
                .select('id, rol')
                .eq('referral_code', referralCode.trim().toUpperCase())
                .maybeSingle()

            if (referrer) {
                const esSelfReferral = referrer.id === userId
                // Profesores pueden referir sus propios cursos (40%) o cursos ajenos (20% como vendedor).
                // Vendedores pueden referir cualquier curso (20%).
                const codigoValido = !esSelfReferral
                if (codigoValido) referredById = referrer.id
            }
        }

        // 4. Obtener monto previamente pagado si existe
        let montoPrevio = 0
        const { data: compraPrevia } = await supabase
            .from('ie_compras')
            .select('monto_pagado')
            .eq('user_id', userId)
            .eq('curso_id', cursoId)
            .single()
        
        if (compraPrevia?.monto_pagado) {
            montoPrevio = compraPrevia.monto_pagado
        }

        // 5. Procesar Cupón si existe
        let porcentajeDescuento = 0
        let finalPrice = esConstancia ? Math.max(0, curso.precio - montoPrevio) : curso.precio
        let basePrice = finalPrice
        let usoCupon = false

        if (cuponCodigo) {
            const { data: cupon } = await supabase
                .from('ie_cupones')
                .select('*')
                .eq('codigo', cuponCodigo)
                .eq('activo', true)
                .single()

            if (cupon) {
                if (cupon.curso_id && cupon.curso_id !== cursoId) {
                    return NextResponse.json({ error: 'Cupón no válido para este curso' }, { status: 400 })
                }
                porcentajeDescuento = cupon.descuento_porcentaje
                usoCupon = true
                finalPrice = porcentajeDescuento === 100 ? 0 : basePrice - (basePrice * (porcentajeDescuento / 100))
            } else {
                return NextResponse.json({ error: 'Cupón inválido o expirado' }, { status: 400 })
            }
        }

        // 6. Si el precio final es 0, registramos directo sin Stripe
        if (finalPrice <= 0) {
            const { data: existe } = await supabase
                .from('ie_compras')
                .select('id')
                .eq('user_id', userId)
                .eq('curso_id', cursoId)
                .single()

            if (!existe) {
                await supabase.from('ie_compras').insert({
                    user_id: userId,
                    curso_id: cursoId,
                    pagado: true,
                    pago_completo: esConstancia ? true : false,
                    monto_pagado: montoPrevio,
                    ...(referredById ? { referred_by: referredById } : {}),
                })
            } else if (esConstancia) {
                await supabase.from('ie_compras')
                    .update({ pago_completo: true })
                    .eq('id', existe.id)
            }
            return NextResponse.json({ success: true, url: null })
        } else if (finalPrice < 10) {
            return NextResponse.json({ error: 'El monto mínimo procesable por Stripe (Tarjeta/OXXO) es de $10.00 MXN. Por favor, selecciona otro método de pago o comunícate con soporte.' }, { status: 400 })
        }

        const referer = req.headers.get('referer')
        const absoluteUrl = referer 
            ? new URL(referer).origin 
            : (process.env.NEXT_PUBLIC_APP_URL || 'https://cursos-iedch.vercel.app')

        // 7. Crear sesión de Stripe Checkout
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
                        unit_amount: Math.round(finalPrice * 100),
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
                pago_completo: (esConstancia || !usoCupon) ? 'true' : 'false',
                monto_pagado: (montoPrevio + finalPrice).toString(),
                ...(referredById ? { referred_by: referredById } : {}),
            }
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
