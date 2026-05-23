import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId, quantity } = await req.json();

    if (!userId || !quantity || typeof quantity !== 'number' || quantity < 1 || quantity > 5) {
      return NextResponse.json({ error: 'Parámetros userId o quantity inválidos.' }, { status: 400 });
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
    if (currentActive + quantity > 5) {
      return NextResponse.json({ 
        error: `Límite excedido. Solo puedes mantener un máximo de 5 cupones activos (sin usar) al mismo tiempo. Actualmente tienes ${currentActive} cupones activos, por lo que solo puedes comprar hasta ${5 - currentActive} cupones más.`
      }, { status: 400 });
    }

    // 3. Fetch ticket cost
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('qui_system_settings')
      .select('ticket_cost')
      .eq('id', 'points_config')
      .single();

    if (settingsError) {
      console.error('Error fetching ticket cost:', settingsError.message);
    }
    const ticketCost = Number(settings?.ticket_cost) || 200;

    // 4. Generate unique coupon codes (QP-XXXX-XXXX)
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

    // 5. Insert coupons safely
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('qui_coupons')
      .insert(couponsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting coupons:', insertError.message);
      return NextResponse.json({ error: `Error al registrar los cupones: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se han generado ${quantity} cupones prepago exitosamente.`,
      coupons: inserted 
    });

  } catch (err: any) {
    console.error('Error inside buy-coupons API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
