import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId, email, action, quantity } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Faltan parámetros de usuario (userId, email).' }, { status: 400 });
    }

    // Get site domain dynamically for redirects
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Fetch dynamic ticket cost from system settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('qui_system_settings')
      .select('ticket_cost')
      .eq('id', 'points_config')
      .single();

    const ticketCost = Number(settings?.ticket_cost) || 200;

    // --- SELLER PREPAID COUPON PURCHASE FLOW ---
    if (action === 'buy_coupons') {
      const buyQty = Number(quantity);
      if (!buyQty || buyQty < 1 || buyQty > 5) {
        return NextResponse.json({ error: 'La cantidad de cupones debe ser entre 1 y 5.' }, { status: 400 });
      }

      // 1. Verify seller role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('qui_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile || profile.role !== 'vendedor') {
        return NextResponse.json({ error: 'Operación no autorizada. Solo los vendedores autorizados pueden adquirir cupones prepago.' }, { status: 403 });
      }

      // 2. Fetch current active coupons to enforce the 5 active coupons limit
      const { count: activeCount, error: countError } = await supabaseAdmin
        .from('qui_coupons')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'active');

      if (countError) {
        console.error('Error counting active coupons:', countError.message);
        return NextResponse.json({ error: 'Error al verificar límite de cupones activos.' }, { status: 500 });
      }

      const currentActive = activeCount || 0;
      if (currentActive + buyQty > 5) {
        return NextResponse.json({ 
          error: `Límite excedido. Solo puedes mantener un máximo de 5 cupones activos (sin usar) al mismo tiempo. Actualmente tienes ${currentActive} cupones activos, por lo que solo puedes comprar hasta ${5 - currentActive} cupones más.`
        }, { status: 400 });
      }

      // 3. Create Stripe Checkout Session with bulk metadata
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: 'Cupones Prepago - Quiniela Mundialista 2026',
                description: `Adquisición de ${buyQty} ${buyQty === 1 ? 'cupón prepago' : 'cupones prepagos'} para venta física en efectivo.`,
                images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'],
              },
              unit_amount: ticketCost * 100, // ticketCost in cents
            },
            quantity: buyQty,
          },
        ],
        mode: 'payment',
        customer_email: email,
        client_reference_id: userId,
        metadata: {
          userId: userId,
          action: 'buy_coupons',
          quantity: String(buyQty),
        },
        success_url: `${origin}/vendedor?success=true`,
        cancel_url: `${origin}/vendedor?cancel=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    // --- STANDARD USER TICKET COOPERATION FLOW ---
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
            unit_amount: ticketCost * 100, // Dynamic ticket cost in cents
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
