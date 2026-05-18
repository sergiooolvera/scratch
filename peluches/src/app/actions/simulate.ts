'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function simulatePedido(userId?: string) {
  try {
    console.log('Simulando pedido: Buscando productos...')
    // 1. Obtener un producto al azar para la simulación
    const { data: products, error: prodError } = await supabaseAdmin.from('pl_products').select('id, price').limit(1)
    
    if (prodError) {
      console.error('Error al buscar productos:', prodError)
      throw prodError
    }

    console.log('Productos encontrados:', products)

    // 2. Obtener una dirección al azar
    const { data: addresses } = await supabaseAdmin.from('pl_addresses').select('id').limit(1)

    if (!products || products.length === 0) {
      throw new Error('Debes tener al menos un producto en la base de datos para simular un pedido.')
    }

    const randomProduct = products[0]
    const randomAddress = addresses && addresses.length > 0 ? addresses[0].id : null

    console.log('Creando pedido en pl_orders...')
    // 3. Crear el pedido usando supabaseAdmin (Bypassa RLS)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('pl_orders')
      .insert([{
        user_id: userId || null,
        total_amount: Number(randomProduct.price) + 150, // Precio + envío simulado
        status: 'paid',
        stripe_payment_intent_id: 'pi_simulado_' + Math.random().toString(36).substring(2, 9),
        shipping_address_id: randomAddress
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Error al crear pedido:', orderError)
      throw orderError
    }

    console.log('Pedido creado:', order.id, 'Creando items...')

    // 4. Crear el item
    const { error: itemError } = await supabaseAdmin
      .from('pl_order_items')
      .insert([{
        order_id: order.id,
        product_id: randomProduct.id,
        quantity: 1,
        price_at_time: randomProduct.price,
        custom_message: 'Mensaje simulado de prueba'
      }])

    if (itemError) {
      console.error('Error al crear item:', itemError)
      throw itemError
    }

    console.log('Item creado con éxito!')
    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error('Error en simulatePedido:', error)
    return { error: error.message || 'Error desconocido' }
  }
}
