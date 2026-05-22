import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { adminId } = await req.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // 1. Verify administrative privileges
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada. Requiere rol de Administrador.' }, { status: 403 });
    }

    // 2. Delete all predictions (using service key bypasses RLS)
    const { error: deletePredsError } = await supabaseAdmin
      .from('qui_predictions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything safely

    if (deletePredsError) throw deletePredsError;

    // 3. Reset scores and statuses on matches
    const { error: resetMatchesError } = await supabaseAdmin
      .from('qui_matches')
      .update({
        home_score: null,
        away_score: null,
        status: 'pending'
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (resetMatchesError) throw resetMatchesError;

    // 4. Reset scores on all profiles
    const { error: resetProfilesError } = await supabaseAdmin
      .from('qui_profiles')
      .update({
        points: 0,
        exact_scores: 0,
        goal_difference: 0
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (resetProfilesError) throw resetProfilesError;

    return NextResponse.json({ 
      success: true, 
      message: `La quiniela se ha reiniciado por completo y los marcadores vuelven a cero.`
    });
  } catch (err: any) {
    console.error('Error resetting quiniela:', err.message);
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
  }
}
