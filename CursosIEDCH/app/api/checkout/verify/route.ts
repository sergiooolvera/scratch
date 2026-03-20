import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
})

// Usamos admin client para poder guardar la compra independiente del contexto local
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const sessionId = url.searchParams.get('session_id')

        if (!sessionId) {
            // Redirigir al inicio o mostrar error si no hay session_id
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        // Obtener la sesión validada de Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        // Si el pago se hizo correctamente
        if (session.payment_status === 'paid') {
            const userId = session.metadata?.user_id
            const cursoId = session.metadata?.curso_id

            if (userId && cursoId) {
                // Primero verificar si ya se guardó la compra (por webhook u otro lado)
                const { data: existe } = await supabaseAdmin
                    .from('ie_compras')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('curso_id', cursoId)
                    .single()

                // Si no existe, la registramos
                if (!existe) {
                    const { error } = await supabaseAdmin.from('ie_compras').insert({
                        user_id: userId,
                        curso_id: cursoId,
                        pagado: true,
                    })

                    if (error) console.error('Error registrando compra en DB:', error)
                    else console.log('Compra validada y registrada correctamente vía redirección.')
                }
            }
        }

        // Al final, independientemente redirigimos al dashboard o mis cursos
        return NextResponse.redirect(new URL('/mis-cursos?compra_exitosa=true', req.url))
    } catch (error) {
        console.error('Error verificando sesión de checkout:', error)
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }
}
