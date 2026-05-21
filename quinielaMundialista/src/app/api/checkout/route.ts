import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Faltan parámetros de usuario (userId, email).' }, { status: 400 });
    }

    // 1. Verify user profile exists in Supabase
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_active')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'El perfil de usuario no existe.' }, { status: 404 });
    }

    if (profile.is_active) {
      return NextResponse.json({ error: 'El boleto ya está pagado y activo.' }, { status: 400 });
    }

    // Get site domain dynamically for redirects
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Cooperación Técnica - Quiniela Mundialista 2026',
              description: 'Aportación voluntaria para soporte técnico y mantenimiento de la plataforma lúdica.',
              images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'],
            },
            unit_amount: 20000, // $200.00 MXN in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      client_reference_id: userId, // CRITICAL: This is used to identify the user on the webhook
      metadata: {
        userId: userId,
      },
      success_url: `${origin}/pay?success=true`,
      cancel_url: `${origin}/pay?cancel=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating Stripe session:', err.message);
    return NextResponse.json({ error: 'Error al procesar pasarela de Stripe.' }, { status: 500 });
  }
}
