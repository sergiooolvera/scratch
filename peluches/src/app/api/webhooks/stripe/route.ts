import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata
    const items = JSON.parse(metadata?.items || '[]')
    const shippingAddressId = metadata?.shipping_address_id
    
    try {
      // Obtener detalles del envío seleccionado si existe
      let selectedShipping = 'No seleccionado';
      if (session.shipping_cost?.shipping_rate) {
        try {
          const rate = await stripe.shippingRates.retrieve(session.shipping_cost.shipping_rate as string);
          selectedShipping = rate.display_name || 'Desconocido';
        } catch (e) {
          console.error('Error al recuperar tasa de envío:', e);
        }
      }

      // 1. Create the order in pl_orders
      const { data: order, error: orderError } = await supabaseAdmin
        .from('pl_orders')
        .insert([{
          total_amount: (session.amount_total || 0) / 100,
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          shipping_address_id: shippingAddressId || null
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Create order items in pl_order_items
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.q,
        price_at_time: item.p,
        custom_message: item.m
      }))

      const { error: itemsError } = await supabaseAdmin
        .from('pl_order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      console.log(`✅ Order ${order.id} created successfully from webhook. Envio: ${selectedShipping}`)
      
      // Aquí podríamos llamar a Envia.com para generar la guía automáticamente
      // Usando el shippingAddressId para buscar la dirección completa
      
    } catch (err: any) {
      console.error(`❌ Error processing order in webhook: ${err.message}`)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
