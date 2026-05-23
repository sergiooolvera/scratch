import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Parámetros userId o code inválidos.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Fetch current profile of the user to see if they are already active
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('qui_profiles')
      .select('username, full_name, is_active, referred_by')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Perfil de participante no encontrado.' }, { status: 404 });
    }

    if (userProfile.is_active) {
      return NextResponse.json({ error: 'Tu perfil de participante ya se encuentra ACTIVO.' }, { status: 400 });
    }

    // 2. Fetch the coupon by code
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('qui_coupons')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (couponError) {
      console.error('Error fetching coupon:', couponError.message);
      return NextResponse.json({ error: 'Error al buscar el código de cupón.' }, { status: 500 });
    }

    if (!coupon) {
      return NextResponse.json({ error: 'Cupón inválido. Por favor verifica que el código esté escrito correctamente.' }, { status: 400 });
    }

    if (coupon.status === 'used') {
      return NextResponse.json({ error: 'Este cupón ya ha sido utilizado por otro participante.' }, { status: 400 });
    }

    // 3. Update the coupon as used
    const { error: updateCouponError } = await supabaseAdmin
      .from('qui_coupons')
      .update({
        status: 'used',
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', coupon.id);

    if (updateCouponError) {
      console.error('Error updating coupon:', updateCouponError.message);
      return NextResponse.json({ error: 'Error al registrar el canje del cupón.' }, { status: 500 });
    }

    // 4. Update the user profile: mark as active and link referred_by if empty
    const profileUpdates: any = { is_active: true };
    if (!userProfile.referred_by) {
      profileUpdates.referred_by = coupon.seller_id;
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from('qui_profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (updateProfileError) {
      console.error('Error updating user profile:', updateProfileError.message);
      // Rollback coupon state if profile activation fails
      await supabaseAdmin.from('qui_coupons').update({ status: 'active', used_by: null, used_at: null }).eq('id', coupon.id);
      return NextResponse.json({ error: 'Error al activar tu perfil de participante.' }, { status: 500 });
    }

    // 5. Send notification to the user
    await supabaseAdmin
      .from('qui_notifications')
      .insert({
        user_id: userId,
        message: `🎉 ¡Felicidades! Has activado con éxito tu participación en la quiniela mediante el cupón prepago ${cleanCode}. ¡Ya puedes ingresar tus pronósticos!`,
        read: false
      });

    // 6. Send notification to the seller
    const participantName = userProfile.full_name || `@${userProfile.username}` || 'Un participante';
    await supabaseAdmin
      .from('qui_notifications')
      .insert({
        user_id: coupon.seller_id,
        message: `🎟️ ¡Tu cupón prepago ${cleanCode} ha sido canjeado por ${participantName}! Se ha contabilizado en tu registro de referidos.`,
        read: false
      });

    return NextResponse.json({
      success: true,
      message: '¡Cupón prepago canjeado con éxito! Tu perfil ahora está activo.'
    });

  } catch (err: any) {
    console.error('Error in redeem API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
