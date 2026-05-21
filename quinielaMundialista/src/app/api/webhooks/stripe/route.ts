import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;

  try {
    if (!signature || !webhookSecret) {
      throw new Error('Signature or Webhook secret is missing.');
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Signature verification failed: ${err.message}` }, { status: 400 });
  }

  // Handle the specific event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    const userId = session.client_reference_id;
    const stripeCustomerId = session.customer;
    const amountTotal = (session.amount_total || 20000) / 100; // Cents to MXN
    const sessionId = session.id;

    if (!userId) {
      console.error('⚠️ client_reference_id (userId) missing in Stripe session.');
      return NextResponse.json({ error: 'userId missing in session' }, { status: 400 });
    }

    console.log(`🔔 Webhook: Payment completed for User ${userId}. Amount: $${amountTotal} MXN.`);

    try {
      // 1. Update user profile payment state
      const { error: profileError } = await supabaseAdmin
        .from('qui_profiles')
        .update({
          is_active: true,
          stripe_customer_id: stripeCustomerId,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Register receipt in qui_payments
      const { error: paymentError } = await supabaseAdmin
        .from('qui_payments')
        .upsert({
          id: sessionId,
          user_id: userId,
          amount: amountTotal,
          status: 'paid',
        });

      if (paymentError) throw paymentError;

      // 3. Dynamic pool accumulation inside qui_system_settings
      // Get current config settings
      const { data: settings, error: configError } = await supabaseAdmin
        .from('qui_system_settings')
        .select('pool_accumulated')
        .eq('id', 'points_config')
        .single();

      if (!configError && settings) {
        const newPool = (Number(settings.pool_accumulated) || 0) + amountTotal;
        await supabaseAdmin
          .from('qui_system_settings')
          .update({ pool_accumulated: newPool })
          .eq('id', 'points_config');
      }

      console.log(`✅ Success: Activated profile and updated pool for user ${userId}.`);
    } catch (err: any) {
      console.error('⚠️ Database update failure inside Stripe webhook:', err.message);
      return NextResponse.json({ error: `Database update failed: ${err.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
