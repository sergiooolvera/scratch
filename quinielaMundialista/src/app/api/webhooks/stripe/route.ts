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

    const isBuyCoupons = session.metadata?.action === 'buy_coupons';

    try {
      if (isBuyCoupons) {
        // --- SELLER PREPAID COUPON GENERATION FLOW ---
        const quantity = Number(session.metadata.quantity) || 1;
        const ticketCost = amountTotal / quantity;

        // Generate unique coupon codes (QP-XXXX-XXXX)
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluyendo O, 0, I, 1
        const generateCode = () => {
          let part1 = '';
          let part2 = '';
          for (let i = 0; i < 4; i++) {
            part1 += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            part2 += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
          }
          return `QP-${part1}-${part2}`;
        };

        const couponsToInsert = [];
        for (let i = 0; i < quantity; i++) {
          let uniqueCode = '';
          let isUnique = false;
          let checkAttempts = 0;

          while (!isUnique && checkAttempts < 10) {
            uniqueCode = generateCode();
            const { data: existing } = await supabaseAdmin
              .from('qui_coupons')
              .select('id')
              .eq('code', uniqueCode)
              .maybeSingle();

            if (!existing) {
              isUnique = true;
            }
            checkAttempts++;
          }

          if (!isUnique) {
            throw new Error('No se pudo generar un código de cupón único. Intenta nuevamente.');
          }

          couponsToInsert.push({
            code: uniqueCode,
            seller_id: userId,
            price_paid: ticketCost,
            status: 'active'
          });
        }

        // Insert coupons safely
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('qui_coupons')
          .insert(couponsToInsert)
          .select();

        if (insertError) throw insertError;

        // Register receipt in qui_payments
        const { error: paymentError } = await supabaseAdmin
          .from('qui_payments')
          .upsert({
            id: sessionId,
            user_id: userId,
            amount: amountTotal,
            status: 'paid',
          });

        if (paymentError) throw paymentError;

        // Send a system notification to the seller
        const notificationMsg = `🎟️ ¡Tu pago en Stripe fue confirmado! Se han generado ${quantity} ${quantity === 1 ? 'cupón prepago' : 'cupones prepagos'} en tu panel.`;
        await supabaseAdmin
          .from('qui_notifications')
          .insert({
            user_id: userId,
            message: notificationMsg,
            read: false
          });

        console.log(`✅ Success: Generated ${quantity} coupons and sent notification for seller ${userId}.`);
      } else {
        // --- STANDARD USER BOLETO ACTIVATION FLOW ---
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

        console.log(`✅ Success: Activated profile for user ${userId}.`);
      }

      // --- COMMON FLOW: Pool accumulation inside qui_system_settings ---
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

      console.log(`✅ Success: Global pool updated. Added $${amountTotal} MXN.`);
    } catch (err: any) {
      console.error('⚠️ Database update failure inside Stripe webhook:', err.message);
      return NextResponse.json({ error: `Database update failed: ${err.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
