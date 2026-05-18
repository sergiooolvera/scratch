'use server'

import Stripe from 'stripe'
import { CartItem } from '@/store/useCartStore'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function createCheckoutSession(items: CartItem[], userEmail?: string, shippingRates?: any[], shippingAddressId?: string) {
  const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  if (!items || items.length === 0) {
    throw new Error('No items in cart')
  }

  const line_items = items.map((item) => ({
    price_data: {
      currency: 'mxn',
      product_data: {
        name: item.name,
        images: item.images && item.images.length > 0 
          ? [item.images[0].startsWith('http') ? item.images[0] : `${origin}${item.images[0]}`] 
          : [],
        description: item.description,
      },
      unit_amount: Math.round(Number(item.price) * 100), // Stripe uses cents
    },
    quantity: item.quantity,
  }))

  const stripeShippingOptions = shippingRates
    ?.sort((a, b) => a.price - b.price)
    .slice(0, 5)
    .map(rate => ({
      shipping_rate_data: {
        type: 'fixed_amount' as const,
        fixed_amount: {
          amount: Math.round(rate.price * 100),
          currency: 'mxn',
        },
        display_name: `${rate.carrier} (${rate.service_name})`,
        delivery_estimate: {
          minimum: { unit: 'business_day' as const, value: rate.carrier === 'DHL' ? 1 : 3 },
          maximum: { unit: 'business_day' as const, value: rate.carrier === 'DHL' ? 2 : 5 },
        }
      }
    }))

  try {
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout/success`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: userEmail,
      shipping_options: stripeShippingOptions,
      metadata: {
        shipping_address_id: shippingAddressId || '',
        items: JSON.stringify(items.map(i => ({ 
          id: i.id, 
          q: i.quantity, 
          p: i.price,
          m: i.custom_message || '',
          s: i.size || '',
          d: i.delivery_date || ''
        })))
      }
    })

    return { sessionId: session.id, url: session.url }
  } catch (err: any) {
    console.error("Stripe Error:", err)
    return { error: err.message }
  }
}
