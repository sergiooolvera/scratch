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
                await supabase.from('ie_compras').insert({
                    user_id: userId,
                    curso_id: cursoId,
                    pagado: true,
                })
            }
            return NextResponse.json({ success: true, url: null })
        }

        // Determine the domain dynamically to avoid localhost redirect errors in production
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:3000';
        const absoluteUrl = `${protocol}://${host}`;

        // 5. Crear sesión de Stripe Checkout si hay un costo > 0
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
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
            }
        })

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
