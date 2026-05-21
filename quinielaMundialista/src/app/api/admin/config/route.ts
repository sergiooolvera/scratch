import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const {
      adminId,
      points_exact_score,
      points_correct_winner,
      points_correct_draw,
      points_incorrect,
      lock_hours_before,
      ticket_cost,
      pool_accumulated,
      pct_first_place,
      pct_second_place,
      pct_third_place
    } = await req.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Parámetro adminId faltante.' }, { status: 400 });
    }

    // 1. Verify admin role
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada.' }, { status: 403 });
    }

    const safeNum = (val: any, fallback: number) => (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(val) : fallback;

    // 2. Perform updates to settings
    const { error: updateError } = await supabaseAdmin
      .from('qui_system_settings')
      .upsert({
        id: 'points_config',
        points_exact_score: safeNum(points_exact_score, 3),
        points_correct_winner: safeNum(points_correct_winner, 1),
        points_correct_draw: safeNum(points_correct_draw, 1),
        points_incorrect: safeNum(points_incorrect, 0),
        lock_hours_before: safeNum(lock_hours_before, 24),
        ticket_cost: safeNum(ticket_cost, 200.00),
        pool_accumulated: safeNum(pool_accumulated, 0.00),
        pct_first_place: safeNum(pct_first_place, 50),
        pct_second_place: safeNum(pct_second_place, 25),
        pct_third_place: safeNum(pct_third_place, 5),
      });

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Configuración actualizada correctamente.' });
  } catch (err: any) {
    console.error('Error inside config API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
