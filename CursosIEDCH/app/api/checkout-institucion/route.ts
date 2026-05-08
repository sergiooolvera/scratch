import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
})

export async function POST(req: Request) {
    try {
        const { planId, userId, cuponCodigo, isSubscription = false } = await req.json()

        // 1. Verificar sesión de Supabase
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.id !== userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // 2. Obtener precios de la base de datos (o hardcode defaults)
        let price = 50;
        let name = 'Plan Individual';
        let desc = '1 Certificado de actividad';
        let applySubscription = false;

        if (planId === 'pro') {
            price = 400;
            name = 'Suscripción PRO';
            desc = isSubscription ? '10 Certificados de actividad (Renovación Mensual)' : '10 Certificados de actividad (Pago Único)';
            applySubscription = isSubscription;
        } else if (planId === 'ultra') {
            price = 3000;
            name = 'Suscripción ULTRA';
            desc = isSubscription ? '100 Certificados de actividad (Renovación Mensual)' : '100 Certificados de actividad (Pago Único)';
            applySubscription = isSubscription;
        }

        let porcentajeDescuento = 0;
        if (cuponCodigo) {
            const { data: cupon } = await supabase
                .from('ie_cupones')
                .select('*')
                .eq('codigo', cuponCodigo)
                .eq('activo', true)
                .single()

            if (cupon) {
                porcentajeDescuento = cupon.descuento_porcentaje;
                price = porcentajeDescuento === 100 ? 0 : price - (price * (porcentajeDescuento / 100));
            } else {
                return NextResponse.json({ error: 'Cupón inválido o expirado' }, { status: 400 })
            }
        }

        // Si el precio es 0, no vamos a Stripe, procesamos directo.
        if (price <= 0) {
            // Esto debería llamar a una función para acreditar el plan directamente, pero 
            // por simplicidad y seguridad, un plan institucional gratis requeriría intervención
            // manual o un endpoint seguro. Si tienen un cupón 100%, devolvemos un mensaje de error 
            // o lo procesamos aquí.
            return NextResponse.json({ error: 'Los planes institucionales no soportan descuento del 100% automático por ahora.' }, { status: 400 })
        }

        // Obtener URL de origen para redirecciones
        const referer = req.headers.get('referer')
        const absoluteUrl = referer 
            ? new URL(referer).origin 
            : (process.env.NEXT_PUBLIC_APP_URL || 'https://cursos-iedch.vercel.app')

        // 3. Crear sesión de Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: applySubscription ? ['card'] : ['card', 'oxxo'],
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: name + (porcentajeDescuento > 0 ? ` (Desc. ${porcentajeDescuento}%)` : ''),
                            description: desc,
                        },
                        unit_amount: Math.round(price * 100),
                        ...(applySubscription ? { recurring: { interval: 'month' } } : {})
                    },
                    quantity: 1,
                },
            ],
            mode: applySubscription ? 'subscription' : 'payment',
            success_url: `${absoluteUrl}/institucion/expediente?payment_success=true`,
            cancel_url: `${absoluteUrl}/institucion/registrar-actividad?canceled=1`,
            client_reference_id: userId,
            metadata: {
                tipo_compra: 'institucion_plan',
                plan_id: planId,
                user_id: userId,
            }
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('[STRIPE_CHECKOUT_INSTITUCION_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
